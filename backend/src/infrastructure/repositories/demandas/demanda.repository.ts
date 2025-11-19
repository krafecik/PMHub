import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import {
  Demanda,
  TituloVO,
  TipoDemandaVO,
  OrigemDemandaVO,
  PrioridadeVO,
  StatusDemandaVO,
} from '@domain/demandas';
import {
  IDemandaRepository,
  DemandaFilters,
  DemandaPaginatedResult,
} from './demanda.repository.interface';
import { Prisma } from '@prisma/client';
import { CatalogItemVO, CatalogItemProps } from '@domain/shared/value-objects/catalog-item.vo';

const normalizeFilterValue = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

@Injectable()
export class DemandaRepository implements IDemandaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(demanda: Demanda): Promise<string> {
    const data = this.toPrisma(demanda);

    const createData: Prisma.DemandaUncheckedCreateInput = {
      tenant_id: BigInt(data.tenant_id),
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      tipo_id: BigInt(data.tipo_id),
      produto_id: BigInt(data.produto_id),
      origem_id: BigInt(data.origem_id),
      origem_detalhe: data.origem_detalhe ?? null,
      responsavel_id: data.responsavel_id ? BigInt(data.responsavel_id) : null,
      prioridade_id: BigInt(data.prioridade_id),
      status_id: BigInt(data.status_id),
      criado_por_id: BigInt(data.criado_por_id),
      deleted_at: data.deleted_at ?? null,
    };

    const created = await this.prisma.demanda.create({
      data: createData,
    });

    return created.id.toString();
  }

  async findById(tenantId: string, id: string): Promise<Demanda | null> {
    const demanda = await this.prisma.demanda.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
      include: this.catalogIncludes(),
    });

    if (!demanda) return null;

    return this.toDomain(demanda);
  }

  async findAll(tenantId: string, filters?: DemandaFilters): Promise<DemandaPaginatedResult> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DemandaWhereInput = {
      tenant_id: BigInt(tenantId),
      deleted_at: null,
    };

    if (filters?.status?.length) {
      const normalized = filters.status.map(normalizeFilterValue);
      where.status = { is: { slug: { in: normalized } } };
    }

    if (filters?.tipo?.length) {
      const normalized = filters.tipo.map(normalizeFilterValue);
      where.tipo = { is: { slug: { in: normalized } } };
    }

    if (filters?.produtoId) {
      where.produto_id = BigInt(filters.produtoId);
    }

    if (filters?.responsavelId) {
      where.responsavel_id = BigInt(filters.responsavelId);
    }

    if (filters?.origem?.length) {
      const normalized = filters.origem.map(normalizeFilterValue);
      where.origem = { is: { slug: { in: normalized } } };
    }

    if (filters?.prioridade?.length) {
      const normalized = filters.prioridade.map(normalizeFilterValue);
      where.prioridade = { is: { slug: { in: normalized } } };
    }

    if (filters?.criadoPorId) {
      where.criado_por_id = BigInt(filters.criadoPorId);
    }

    if (filters?.search) {
      where.OR = [
        { titulo: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.DemandaOrderByWithRelationInput = {};
    if (filters?.orderBy) {
      const fieldMap: Record<string, keyof Prisma.DemandaOrderByWithRelationInput> = {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        created_at: 'created_at',
        updated_at: 'updated_at',
      };
      const prismaField =
        fieldMap[filters.orderBy] ||
        (filters.orderBy as keyof Prisma.DemandaOrderByWithRelationInput);
      orderBy[prismaField] = filters.orderDirection || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [demandas, total] = await Promise.all([
      this.prisma.demanda.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: this.catalogIncludes(),
      }),
      this.prisma.demanda.count({ where }),
    ]);

    return {
      data: demandas.map((d) => this.toDomain(d)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(demanda: Demanda): Promise<void> {
    if (!demanda.id) throw new Error('Demanda sem ID não pode ser atualizada');

    const data = this.toPrisma(demanda);

    const updateData: Prisma.DemandaUncheckedUpdateInput = {
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      tipo_id: BigInt(data.tipo_id),
      produto_id: BigInt(data.produto_id),
      origem_id: BigInt(data.origem_id),
      origem_detalhe: data.origem_detalhe ?? null,
      responsavel_id: data.responsavel_id ? BigInt(data.responsavel_id) : null,
      prioridade_id: BigInt(data.prioridade_id),
      status_id: BigInt(data.status_id),
      updated_at: new Date(),
      deleted_at: data.deleted_at ?? null,
    };

    await this.prisma.demanda.update({
      where: { id: BigInt(demanda.id) },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.demanda.updateMany({
      where: { id: BigInt(id), tenant_id: BigInt(tenantId) },
      data: { deleted_at: new Date(), updated_at: new Date() },
    });
  }

  private catalogIncludes(): Prisma.DemandaInclude {
    return {
      tipo: { include: { categoria: true } },
      origem: { include: { categoria: true } },
      prioridade: { include: { categoria: true } },
      status: { include: { categoria: true } },
      tags: {
        include: {
          tag: true,
        },
      },
    };
  }

  private mapCatalogItem(prismaItem: any): CatalogItemVO {
    return CatalogItemVO.create({
      id: prismaItem.id.toString(),
      tenantId: prismaItem.tenant_id.toString(),
      categorySlug: prismaItem.categoria.slug,
      slug: prismaItem.slug,
      label: prismaItem.label,
      ordem: prismaItem.ordem,
      ativo: prismaItem.ativo,
      metadata: (prismaItem.metadados as Prisma.JsonObject | null) ?? null,
      produtoId: prismaItem.produto_id ? prismaItem.produto_id.toString() : null,
    } satisfies CatalogItemProps);
  }

  private toPrisma(demanda: Demanda): any {
    const obj = demanda.toObject();
    return {
      id: obj.id ? BigInt(obj.id) : undefined,
      tenant_id: obj.tenantId,
      titulo: obj.titulo.getValue(),
      descricao: obj.descricao,
      tipo_id: obj.tipo.id,
      produto_id: obj.produtoId,
      origem_id: obj.origem.id,
      origem_detalhe: obj.origemDetalhe,
      responsavel_id: obj.responsavelId,
      prioridade_id: obj.prioridade.id,
      status_id: obj.status.id,
      criado_por_id: obj.criadoPorId,
      motivo_cancelamento: obj.motivoCancelamento,
      created_at: obj.createdAt,
      updated_at: obj.updatedAt,
      deleted_at: obj.deletedAt,
    };
  }

  private toDomain(prismaData: any): Demanda {
    const tipo = this.mapCatalogItem(prismaData.tipo);
    const origem = this.mapCatalogItem(prismaData.origem);
    const prioridade = this.mapCatalogItem(prismaData.prioridade);
    const status = this.mapCatalogItem(prismaData.status);

    return Demanda.restore({
      id: prismaData.id.toString(),
      tenantId: prismaData.tenant_id.toString(),
      titulo: TituloVO.create(prismaData.titulo),
      descricao: prismaData.descricao,
      tipo: TipoDemandaVO.fromCatalogItem(tipo),
      produtoId: prismaData.produto_id.toString(),
      origem: OrigemDemandaVO.fromCatalogItem(origem),
      origemDetalhe: prismaData.origem_detalhe,
      responsavelId: prismaData.responsavel_id?.toString(),
      prioridade: PrioridadeVO.fromCatalogItem(prioridade),
      status: StatusDemandaVO.fromCatalogItem(status),
      criadoPorId: prismaData.criado_por_id.toString(),
      motivoCancelamento: prismaData.motivo_cancelamento,
      createdAt: prismaData.created_at,
      updatedAt: prismaData.updated_at,
      deletedAt: prismaData.deleted_at,
    });
  }
}
