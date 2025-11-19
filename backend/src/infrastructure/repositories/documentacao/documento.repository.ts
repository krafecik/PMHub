import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import {
  Prisma,
  Documento as PrismaDocumento,
  DocumentoStatus as PrismaDocumentoStatusEnum,
  DocumentoTipo as PrismaDocumentoTipoEnum,
  DocumentoVersao as PrismaDocumentoVersao,
} from '@prisma/client';
import {
  Documento,
  DocumentoId,
  DocumentoRepository,
  DocumentoStatusVO,
  DocumentoTipoVO,
  DocumentoVersao,
  ListarDocumentosFiltro,
  ListarDocumentosResultado,
  VersaoVO,
} from '@domain/documentacao';
import { randomUUID } from 'crypto';

interface PrismaDocumentoWithRelations extends PrismaDocumento {
  versaoAtual?: PrismaDocumentoVersao | null;
  versoes?: PrismaDocumentoVersao[];
  tags?: {
    tag: {
      id: bigint;
      nome: string;
    };
  }[];
}

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class PrismaDocumentoRepository implements DocumentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(documento: Documento): Promise<void> {
    const data = this.toPrismaDocumento(documento);

    await this.prisma.$transaction(async (tx) => {
      await tx.documento.create({ data });

      for (const versao of documento.versoes) {
        const versaoData = this.toPrismaVersao(versao, documento);
        await tx.documentoVersao.create({ data: versaoData });
      }

      if (documento.versaoAtual?.id) {
        await tx.documento.update({
          where: { id: documento.idValue },
          data: { versao_atual_id: documento.versaoAtual.id },
        });
      }
    });
  }

  async salvar(documento: Documento): Promise<void> {
    const data = this.toPrismaDocumento(documento);

    await this.prisma.$transaction(async (tx) => {
      await tx.documento.update({
        where: { id: documento.idValue },
        data: {
          tipo: data.tipo,
          titulo: data.titulo,
          resumo: data.resumo,
          status: data.status,
          produto_id: data.produto_id,
          pm_id: data.pm_id,
          squad_id: data.squad_id,
          atualizado_por_id: data.atualizado_por_id,
          updated_at: new Date(),
          versao_atual_id: documento.versaoAtual?.id ?? null,
        },
      });

      if (documento.versaoAtual) {
        const versao = documento.versaoAtual;
        const versaoData = this.toPrismaVersao(versao, documento);

        if (versao.id) {
          await tx.documentoVersao.update({
            where: { id: versao.id },
            data: versaoData,
          });
        } else {
          const created = await tx.documentoVersao.create({
            data: versaoData,
          });
          await tx.documento.update({
            where: { id: documento.idValue },
            data: { versao_atual_id: created.id },
          });
        }
      }
    });
  }

  async criarVersao(versao: DocumentoVersao): Promise<void> {
    await this.prisma.documentoVersao.create({
      data: this.toPrismaVersao(versao),
    });
  }

  async encontrarPorId(tenantId: string, documentoId: string): Promise<Documento | null> {
    const documento = await this.prisma.documento.findFirst({
      where: {
        id: documentoId,
        id_tenant: BigInt(tenantId),
        deleted_at: null,
      },
      include: {
        versaoAtual: true,
        versoes: { orderBy: { created_at: 'asc' } },
        tags: { include: { tag: true } },
      },
    });

    if (!documento) {
      return null;
    }

    return this.toDomainDocumento(documento);
  }

  async listar(filtro: ListarDocumentosFiltro): Promise<ListarDocumentosResultado> {
    const page = filtro.page && filtro.page > 0 ? filtro.page : 1;
    const pageSize =
      filtro.pageSize && filtro.pageSize > 0 ? Math.min(filtro.pageSize, 100) : DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DocumentoWhereInput = {
      id_tenant: BigInt(filtro.tenantId),
      deleted_at: null,
    };

    if (filtro.termo) {
      where.OR = [
        { titulo: { contains: filtro.termo, mode: 'insensitive' } },
        { resumo: { contains: filtro.termo, mode: 'insensitive' } },
      ];
    }

    if (filtro.tipos?.length) {
      where.tipo = { in: filtro.tipos as PrismaDocumentoTipoEnum[] };
    }

    if (filtro.status?.length) {
      where.status = { in: filtro.status as PrismaDocumentoStatusEnum[] };
    }

    if (filtro.produtoId) {
      where.produto_id = BigInt(filtro.produtoId);
    }

    if (filtro.pmId) {
      where.pm_id = BigInt(filtro.pmId);
    }

    if (filtro.squadId) {
      where.squad_id = BigInt(filtro.squadId);
    }

    const [total, documentos] = await this.prisma.$transaction([
      this.prisma.documento.count({ where }),
      this.prisma.documento.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip,
        take: pageSize,
        include: {
          versaoAtual: true,
          tags: { include: { tag: true } },
        },
      }),
    ]);

    const itens = documentos.map((doc) => this.toDomainDocumento(doc));

    return {
      itens,
      total,
      page,
      pageSize,
    };
  }

  async encontrarVersaoPorId(tenantId: string, versaoId: string): Promise<DocumentoVersao | null> {
    const versao = await this.prisma.documentoVersao.findFirst({
      where: {
        id: versaoId,
        id_tenant: BigInt(tenantId),
      },
    });

    if (!versao) {
      return null;
    }

    return this.toDomainVersao(versao);
  }

  async listarVersoes(documentoId: string, tenantId: string): Promise<DocumentoVersao[]> {
    const versoes = await this.prisma.documentoVersao.findMany({
      where: {
        documento_id: documentoId,
        id_tenant: BigInt(tenantId),
      },
      orderBy: { created_at: 'desc' },
    });

    return versoes.map((versao) => this.toDomainVersao(versao));
  }

  private toPrismaDocumento(documento: Documento): Prisma.DocumentoUncheckedCreateInput {
    return {
      id: documento.idValue,
      id_tenant: BigInt(documento.tenantId),
      tipo: documento.tipo.getValue() as PrismaDocumentoTipoEnum,
      titulo: documento.titulo,
      resumo: documento.resumo ?? null,
      status: documento.status.getValue() as PrismaDocumentoStatusEnum,
      produto_id: documento.produtoId ? BigInt(documento.produtoId) : null,
      pm_id: documento.pmId ? BigInt(documento.pmId) : null,
      squad_id: documento.squadId ? BigInt(documento.squadId) : null,
      versao_atual_id: documento.versaoAtual?.id ?? null,
      criado_por_id: BigInt(documento.criadoPorId),
      atualizado_por_id: documento.atualizadoPorId ? BigInt(documento.atualizadoPorId) : null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };
  }

  private toPrismaVersao(
    versao: DocumentoVersao,
    documento?: Documento,
  ): Prisma.DocumentoVersaoUncheckedCreateInput {
    const conteudoJson = this.buildConteudoJson(versao, documento);
    const tenantId = documento ? documento.tenantId : versao.tenantId;
    const documentoId = documento ? documento.idValue : versao.documentoId;
    const criadoPor = versao.createdBy ?? documento?.criadoPorId;

    if (!tenantId || !documentoId) {
      throw new Error('Versão do documento requer tenantId e documentoId');
    }

    if (!criadoPor) {
      throw new Error('Versão do documento requer criadoPorId');
    }

    return {
      id: versao.id ?? randomUUID(),
      id_tenant: BigInt(tenantId),
      documento_id: documentoId,
      versao: versao.versao.getValue(),
      conteudo_json: conteudoJson,
      changelog_resumo: versao.changelogResumo ?? null,
      criado_por_id: BigInt(criadoPor),
      created_at: versao.createdAt ?? new Date(),
    };
  }

  private buildConteudoJson(versao: DocumentoVersao, documento?: Documento): Prisma.JsonObject {
    const requisitosNaoFuncionaisJson = (versao.requisitosNaoFuncionais ??
      []) as unknown as Prisma.JsonValue;

    return {
      documentoId: documento?.idValue ?? versao.documentoId ?? null,
      tenantId: documento?.tenantId ?? versao.tenantId ?? null,
      criadoPorId: versao.createdBy ?? documento?.criadoPorId ?? null,
      objetivo: versao.objetivo ?? null,
      contexto: (versao.contexto ?? null) as unknown as Prisma.JsonValue,
      requisitos_funcionais: (versao.requisitosFuncionais ?? []) as unknown as Prisma.JsonValue,
      regras_negocio: (versao.regrasNegocio ?? []) as unknown as Prisma.JsonValue,
      requisitos_nao_funcionais: requisitosNaoFuncionaisJson,
      fluxos: (versao.fluxos ?? null) as unknown as Prisma.JsonValue,
      criterios_aceite: (versao.criteriosAceite ?? []) as unknown as Prisma.JsonValue,
      riscos: (versao.riscos ?? []) as unknown as Prisma.JsonValue,
      changelog_resumo: versao.changelogResumo ?? null,
    };
  }

  private toDomainDocumento(documento: PrismaDocumentoWithRelations): Documento {
    const versoes = (documento.versoes ?? []).map((versao) => this.toDomainVersao(versao));
    const versaoAtual = documento.versaoAtual ? this.toDomainVersao(documento.versaoAtual) : null;

    const aggregate = Documento.restaurar(
      {
        tenantId: documento.id_tenant.toString(),
        tipo: new DocumentoTipoVO(documento.tipo),
        titulo: documento.titulo,
        resumo: documento.resumo ?? undefined,
        status: new DocumentoStatusVO(documento.status),
        produtoId: documento.produto_id ? documento.produto_id.toString() : undefined,
        pmId: documento.pm_id ? documento.pm_id.toString() : undefined,
        squadId: documento.squad_id ? documento.squad_id.toString() : undefined,
        criadoPorId: documento.criado_por_id.toString(),
        atualizadoPorId: documento.atualizado_por_id
          ? documento.atualizado_por_id.toString()
          : undefined,
        createdAt: documento.created_at,
        updatedAt: documento.updated_at,
        versoes,
        versaoAtual,
      },
      new DocumentoId(documento.id),
    );

    return aggregate;
  }

  private toDomainVersao(versao: PrismaDocumentoVersao): DocumentoVersao {
    const conteudo = (versao.conteudo_json ?? {}) as Prisma.JsonObject;
    const objetivo = (conteudo['objetivo'] as string) ?? undefined;
    const contexto = (conteudo['contexto'] as any) ?? undefined;
    const requisitosFuncionais = (conteudo['requisitos_funcionais'] as any[]) ?? [];
    const regrasNegocio = (conteudo['regras_negocio'] as any[]) ?? [];
    const requisitosNaoFuncionais = (conteudo['requisitos_nao_funcionais'] as any[]) ?? [];
    const fluxos = (conteudo['fluxos'] as any) ?? undefined;
    const criteriosAceite = (conteudo['criterios_aceite'] as any[]) ?? [];
    const riscos = (conteudo['riscos'] as any[]) ?? [];

    return new DocumentoVersao({
      id: versao.id,
      documentoId: versao.documento_id,
      tenantId: versao.id_tenant.toString(),
      versao: new VersaoVO(versao.versao),
      objetivo,
      contexto,
      requisitosFuncionais,
      regrasNegocio,
      requisitosNaoFuncionais,
      fluxos,
      criteriosAceite,
      riscos,
      changelogResumo: versao.changelog_resumo ?? undefined,
      conteudoJson: conteudo as Record<string, any>,
      createdAt: versao.created_at,
      createdBy: versao.criado_por_id.toString(),
    });
  }
}
