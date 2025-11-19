import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma.service';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';
import {
  RegraAutomacao,
  RegraAutomacaoPersistence,
} from '@domain/automacao/entities/regra-automacao.entity';
import {
  CondicaoRegraProps,
  CondicaoRegraPersistence,
} from '@domain/automacao/value-objects/condicao-regra.vo';
import {
  AcaoRegraProps,
  AcaoRegraPersistence,
} from '@domain/automacao/value-objects/acao-regra.vo';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

type RawCondicao =
  | (CondicaoRegraProps & {
      campoId?: string;
      operadorId?: string;
    })
  | {
      campo?: string;
      operador?: string;
      valor?: unknown;
      logica?: 'E' | 'OU';
      campoId?: string;
      operadorId?: string;
    };

type RawAcao =
  | (AcaoRegraProps & {
      tipoId?: string;
      campoId?: string;
    })
  | {
      tipo?: string;
      campo?: string;
      valor?: unknown;
      configuracao?: Record<string, any>;
      tipoId?: string;
      campoId?: string;
    };

@Injectable()
export class RegraAutomacaoRepository implements IRegraAutomacaoRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async save(regra: RegraAutomacao): Promise<void> {
    const snapshot = regra.toPersistence();
    await this.prisma.regrasAutomacaoTriagem.upsert({
      where: {
        id: snapshot.id,
      },
      create: {
        id: snapshot.id,
        id_tenant: BigInt(snapshot.tenantId),
        nome: snapshot.nome,
        descricao: snapshot.descricao,
        condicao_json: JSON.stringify(snapshot.condicoes),
        acao_json: JSON.stringify(snapshot.acoes),
        ativo: snapshot.ativo,
        ordem: snapshot.ordem,
        criado_por_id: BigInt(snapshot.criadoPor),
        created_at: snapshot.criadoEm,
        updated_at: snapshot.atualizadoEm,
      },
      update: {
        nome: snapshot.nome,
        descricao: snapshot.descricao,
        condicao_json: JSON.stringify(snapshot.condicoes),
        acao_json: JSON.stringify(snapshot.acoes),
        ativo: snapshot.ativo,
        ordem: snapshot.ordem,
        updated_at: snapshot.atualizadoEm,
      },
    });
  }

  async findById(tenantId: string, id: string): Promise<RegraAutomacao | null> {
    const record = await this.prisma.regrasAutomacaoTriagem.findFirst({
      where: {
        id,
        id_tenant: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!record) return null;

    return this.toDomain(tenantId, record);
  }

  async findByTenant(tenantId: string): Promise<RegraAutomacao[]> {
    const registros = await this.prisma.regrasAutomacaoTriagem.findMany({
      where: {
        id_tenant: BigInt(tenantId),
        deleted_at: null,
      },
      orderBy: {
        ordem: 'asc',
      },
    });

    const regras: RegraAutomacao[] = [];
    for (const registro of registros) {
      const regra = await this.toDomain(tenantId, registro);
      regras.push(regra);
    }
    return regras;
  }

  async findAtivasByTenant(tenantId: string): Promise<RegraAutomacao[]> {
    const registros = await this.prisma.regrasAutomacaoTriagem.findMany({
      where: {
        id_tenant: BigInt(tenantId),
        ativo: true,
        deleted_at: null,
      },
      orderBy: {
        ordem: 'asc',
      },
    });

    const regras: RegraAutomacao[] = [];
    for (const registro of registros) {
      const regra = await this.toDomain(tenantId, registro);
      regras.push(regra);
    }
    return regras;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.regrasAutomacaoTriagem.update({
      where: {
        id,
        id_tenant: BigInt(tenantId),
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  private async toDomain(tenantId: string, data: any): Promise<RegraAutomacao> {
    const rawCondicoes = (JSON.parse(data.condicao_json || '[]') as RawCondicao[]) ?? [];
    const rawAcoes = (JSON.parse(data.acao_json || '[]') as RawAcao[]) ?? [];

    const resolved = await this.resolveCatalogItems(tenantId, rawCondicoes, rawAcoes);

    const snapshot: RegraAutomacaoPersistence = {
      id: data.id,
      tenantId: data.id_tenant.toString(),
      nome: data.nome,
      descricao: data.descricao ?? undefined,
      condicoes: resolved.persistenciasCondicoes,
      acoes: resolved.persistenciasAcoes,
      ativo: data.ativo,
      ordem: data.ordem ?? 0,
      criadoPor: data.criado_por_id?.toString() ?? '',
      criadoEm: data.created_at,
      atualizadoEm: data.updated_at,
    };

    return RegraAutomacao.restaurar(snapshot, {
      condicoes: resolved.condicoes,
      acoes: resolved.acoes,
    });
  }

  private async resolveCatalogItems(
    tenantId: string,
    condicoes: RawCondicao[],
    acoes: RawAcao[],
  ): Promise<{
    condicoes: CondicaoRegraProps[];
    persistenciasCondicoes: CondicaoRegraPersistence[];
    acoes: AcaoRegraProps[];
    persistenciasAcoes: AcaoRegraPersistence[];
  }> {
    const ids = new Set<string>();

    condicoes.forEach((cond) => {
      if ('campoId' in cond && cond.campoId) ids.add(cond.campoId);
      if ('operadorId' in cond && cond.operadorId) ids.add(cond.operadorId);
    });

    acoes.forEach((acao) => {
      if ('tipoId' in acao && acao.tipoId) ids.add(acao.tipoId);
      if ('campoId' in acao && acao.campoId) ids.add(acao.campoId);
    });

    const itensPorId = new Map<string, CatalogItemVO>();
    if (ids.size > 0) {
      const itens = await this.catalogoRepository.findItemsByIds(tenantId, Array.from(ids));
      itens.forEach((item) => itensPorId.set(item.id, item));
    }

    const cacheSlug = new Map<string, CatalogItemVO>();

    const resolveItem = async (
      category: string,
      id?: string,
      slug?: string,
      legacyValue?: string,
    ): Promise<CatalogItemVO> => {
      if (id) {
        const cached = itensPorId.get(id);
        if (cached) {
          return cached;
        }
      }

      const cacheKey = `${category}|${slug ?? ''}|${legacyValue ?? ''}`;
      if (cacheSlug.has(cacheKey)) {
        return cacheSlug.get(cacheKey)!;
      }

      const item = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category,
        id,
        slug,
        legacyValue,
      });
      cacheSlug.set(cacheKey, item);
      itensPorId.set(item.id, item);
      return item;
    };

    const condicoesProps: CondicaoRegraProps[] = [];
    const condicoesPersistencia: CondicaoRegraPersistence[] = [];

    for (const cond of condicoes) {
      const campoLegacy =
        typeof (cond as any).campo === 'string' ? ((cond as any).campo as string) : undefined;
      const operadorLegacy =
        typeof (cond as any).operador === 'string' ? ((cond as any).operador as string) : undefined;

      const campoItem = await resolveItem(
        CatalogCategorySlugs.AUTOMACAO_CAMPOS,
        (cond as any).campoId,
        campoLegacy,
        campoLegacy,
      );
      const operadorItem = await resolveItem(
        CatalogCategorySlugs.AUTOMACAO_OPERADORES,
        (cond as any).operadorId,
        operadorLegacy?.toLowerCase(),
        operadorLegacy,
      );

      const logica = (cond as any).logica === 'OU' ? 'OU' : 'E';
      const valor = (cond as any).valor as CondicaoRegraPersistence['valor'];

      condicoesProps.push({
        campo: campoItem.toJSON(),
        operador: operadorItem.toJSON(),
        valor,
        logica,
      });

      condicoesPersistencia.push({
        campoId: campoItem.id,
        operadorId: operadorItem.id,
        valor,
        logica,
      });
    }

    const acoesProps: AcaoRegraProps[] = [];
    const acoesPersistencia: AcaoRegraPersistence[] = [];

    for (const acao of acoes) {
      const tipoLegacy =
        typeof (acao as any).tipo === 'string' ? ((acao as any).tipo as string) : undefined;
      const campoLegacy =
        typeof (acao as any).campo === 'string' ? ((acao as any).campo as string) : undefined;

      const tipoItem = await resolveItem(
        CatalogCategorySlugs.AUTOMACAO_ACOES,
        (acao as any).tipoId,
        tipoLegacy?.toLowerCase(),
        tipoLegacy,
      );

      let campoItem: CatalogItemVO | undefined;
      if ((acao as any).campoId || campoLegacy) {
        campoItem = await resolveItem(
          CatalogCategorySlugs.AUTOMACAO_CAMPOS,
          (acao as any).campoId,
          campoLegacy,
          campoLegacy,
        );
      }

      const valor = (acao as any).valor as AcaoRegraPersistence['valor'];
      const configuracao = (acao as any).configuracao as AcaoRegraPersistence['configuracao'];

      acoesProps.push({
        tipo: tipoItem.toJSON(),
        campo: campoItem?.toJSON(),
        valor,
        configuracao,
      });

      acoesPersistencia.push({
        tipoId: tipoItem.id,
        campoId: campoItem?.id,
        valor,
        configuracao,
      });
    }

    return {
      condicoes: condicoesProps,
      persistenciasCondicoes: condicoesPersistencia,
      acoes: acoesProps,
      persistenciasAcoes: acoesPersistencia,
    };
  }
}
