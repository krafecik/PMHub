import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Discovery } from '../../../domain/discovery/entities';
import {
  IDiscoveryRepository,
  DiscoveryFilters,
  DiscoveryPaginationOptions,
  PaginatedDiscoveries,
} from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import { ProductId } from '../../../domain/shared/value-objects/product-id.vo';
import { DemandaId } from '../../../domain/demandas/value-objects';
import {
  DiscoveryId,
  StatusDiscoveryVO,
  StatusDiscoveryEnum,
  SeveridadeProblemaVO,
} from '../../../domain/discovery/value-objects';
import { CatalogItemVO } from '../../../domain/shared/value-objects/catalog-item.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import { Prisma } from '@prisma/client';

type DiscoveryIncludeShape = {
  status: { include: { categoria: true } };
  severidade: { include: { categoria: true } };
  decisao_parcial: { include: { categoria: true } };
  identificacoes: { include: { catalogo: { include: { categoria: true } } } };
  publicos: { include: { catalogo: { include: { categoria: true } } } };
  produto: true;
  responsavel: { select: { nome: true } };
  criado_por: { select: { nome: true } };
};

type DiscoveryWithCatalogRelations = Prisma.DiscoveryGetPayload<{
  include: DiscoveryIncludeShape;
}>;

type CatalogItemWithCategory = Prisma.CatalogItemGetPayload<{
  include: { categoria: true };
}>;

type DiscoveryEvolucaoLogEntry = {
  tipo: string;
  dados: Record<string, unknown>;
  timestamp: Date;
};

@Injectable()
export class DiscoveryPrismaRepository implements IDiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: TenantId, id: DiscoveryId): Promise<Discovery | null> {
    const discovery = await this.prisma.discovery.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      include: this.catalogIncludes(),
    });

    if (!discovery) {
      return null;
    }

    return this.toDomain(discovery);
  }

  async findByDemandaId(tenantId: TenantId, demandaId: string): Promise<Discovery | null> {
    const discovery = await this.prisma.discovery.findFirst({
      where: {
        id_demanda: BigInt(demandaId),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      include: this.catalogIncludes(),
    });

    if (!discovery) {
      return null;
    }

    return this.toDomain(discovery);
  }

  async findAll(
    tenantId: TenantId,
    filters?: DiscoveryFilters,
    pagination?: DiscoveryPaginationOptions,
  ): Promise<PaginatedDiscoveries> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.DiscoveryWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
    };

    if (filters?.status && filters.status.length > 0) {
      const slugs = filters.status.map((status) => StatusDiscoveryVO.enumToSlug(status));
      where.status = this.buildStatusRelationFilter(slugs);
    }

    if (filters?.responsavelId) {
      where.responsavel_id = BigInt(filters.responsavelId);
    }

    if (filters?.produtoId) {
      where.produto_id = BigInt(filters.produtoId);
    }

    if (filters?.criadoPorId) {
      where.criado_por_id = BigInt(filters.criadoPorId);
    }

    if (filters?.searchTerm) {
      where.OR = [
        { titulo: { contains: filters.searchTerm, mode: 'insensitive' } },
        { descricao: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }

    // Count total
    const total = await this.prisma.discovery.count({ where });

    // Get discoveries
    const sortField = this.resolveSortField(pagination?.sortBy);
    const sortOrder = pagination?.sortOrder || 'desc';

    const discoveries = await this.prisma.discovery.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [sortField]: sortOrder,
      },
      include: this.catalogIncludes(),
    });

    const items = discoveries.map((d) => this.toDomain(d));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByResponsavel(
    tenantId: TenantId,
    responsavelId: UserId,
    pagination?: DiscoveryPaginationOptions,
  ): Promise<PaginatedDiscoveries> {
    return this.findAll(tenantId, { responsavelId: responsavelId.getValue() }, pagination);
  }

  async findByProduto(
    tenantId: TenantId,
    produtoId: ProductId,
    pagination?: DiscoveryPaginationOptions,
  ): Promise<PaginatedDiscoveries> {
    return this.findAll(tenantId, { produtoId: produtoId.getValue() }, pagination);
  }

  async save(discovery: Discovery): Promise<Discovery> {
    const payload = this.buildPersistencePayload(discovery);

    const created = await this.prisma.discovery.create({
      data: payload.createData,
    });

    await this.syncDiscoveryCatalogRelations({
      discoveryId: created.id,
      tenantId: discovery.tenantId.getValue(),
      categorySlug: CatalogCategorySlugs.IDENTIFICACAO_ORIGEM,
      values: payload.relations.comoIdentificado,
      relation: 'identificacoes',
    });

    await this.syncDiscoveryCatalogRelations({
      discoveryId: created.id,
      tenantId: discovery.tenantId.getValue(),
      categorySlug: CatalogCategorySlugs.PUBLICO_ALVO,
      values: payload.relations.publicoAfetado,
      relation: 'publicos',
    });

    const reloaded = await this.findById(
      discovery.tenantId,
      new DiscoveryId(created.id.toString()),
    );

    if (!reloaded) {
      throw new Error('Erro ao carregar discovery recém-criado.');
    }

    return reloaded;
  }

  async update(discovery: Discovery): Promise<Discovery> {
    const discoveryId = discovery.id?.getValue();
    if (!discoveryId) {
      throw new Error('Discovery ID é obrigatório para atualização');
    }

    const payload = this.buildPersistencePayload(discovery);

    await this.prisma.discovery.update({
      where: { id: BigInt(discoveryId) },
      data: payload.updateData,
    });

    await this.syncDiscoveryCatalogRelations({
      discoveryId: BigInt(discoveryId),
      tenantId: discovery.tenantId.getValue(),
      categorySlug: CatalogCategorySlugs.IDENTIFICACAO_ORIGEM,
      values: payload.relations.comoIdentificado,
      relation: 'identificacoes',
    });

    await this.syncDiscoveryCatalogRelations({
      discoveryId: BigInt(discoveryId),
      tenantId: discovery.tenantId.getValue(),
      categorySlug: CatalogCategorySlugs.PUBLICO_ALVO,
      values: payload.relations.publicoAfetado,
      relation: 'publicos',
    });

    const reloaded = await this.findById(discovery.tenantId, new DiscoveryId(discoveryId));

    if (!reloaded) {
      throw new Error('Erro ao carregar discovery atualizado.');
    }

    return reloaded;
  }

  async delete(tenantId: TenantId, id: DiscoveryId): Promise<void> {
    await this.prisma.discovery.update({
      where: { id: BigInt(id.getValue()) },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async countByStatus(tenantId: TenantId, status: StatusDiscoveryEnum): Promise<number> {
    const slug = StatusDiscoveryVO.enumToSlug(status);
    return this.prisma.discovery.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        status: this.buildStatusRelationFilter([slug]),
        deleted_at: null,
      },
    });
  }
  private buildStatusRelationFilter(slugs: string[]): Prisma.CatalogItemRelationFilter {
    return {
      is: {
        slug: { in: slugs },
      },
    };
  }

  private resolveSortField(
    sortBy?: DiscoveryPaginationOptions['sortBy'],
  ): keyof Prisma.DiscoveryOrderByWithRelationInput {
    const allowedFields = ['created_at', 'updated_at', 'titulo'] as const;
    type AllowedField = (typeof allowedFields)[number];

    if (!sortBy) {
      return 'created_at';
    }

    const snakeCase = sortBy
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase() as AllowedField;

    if (allowedFields.includes(snakeCase)) {
      return snakeCase;
    }

    return 'created_at';
  }

  async countByProduto(tenantId: TenantId, produtoId: ProductId): Promise<number> {
    return this.prisma.discovery.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        produto_id: BigInt(produtoId.getValue()),
        deleted_at: null,
      },
    });
  }

  private toDomain(data: DiscoveryWithCatalogRelations): Discovery {
    const statusItem = this.mapCatalogItem(data.status);
    const severidadeItem = this.mapCatalogItem(data.severidade);
    const decisaoParcialItem = this.mapCatalogItem(data.decisao_parcial);

    if (!statusItem || !severidadeItem) {
      throw new Error('Status e severidade são obrigatórios para reconstituir Discovery');
    }

    const identificacoesVO =
      data.identificacoes
        ?.map((entry) => this.mapCatalogItem(entry.catalogo))
        .filter((item): item is CatalogItemVO => item !== null) ?? [];
    const publicosVO =
      data.publicos
        ?.map((entry) => this.mapCatalogItem(entry.catalogo))
        .filter((item): item is CatalogItemVO => item !== null) ?? [];

    const comoIdentificado = identificacoesVO.map((item) => item.getLegacyValue());
    const publicoAfetado = publicosVO.map((item) => item.getLegacyValue());

    return Discovery.fromPersistence({
      id: data.id ? new DiscoveryId(data.id.toString()) : undefined,
      tenantId: new TenantId(data.id_tenant.toString()),
      demandaId: new DemandaId(data.id_demanda.toString()),
      titulo: data.titulo,
      descricao: data.descricao,
      contexto: data.contexto ?? undefined,
      publicoAfetado,
      volumeImpactado: undefined,
      severidade: SeveridadeProblemaVO.fromCatalogItem(severidadeItem),
      comoIdentificado,
      status: StatusDiscoveryVO.fromCatalogItem(statusItem),
      criadoPorId: new UserId(data.criado_por_id.toString()),
      responsavelId: new UserId(data.responsavel_id.toString()),
      produtoId: new ProductId(data.produto_id.toString()),
      evolucaoLog: this.deserializeEvolucaoLog(data.evolucao_log),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
      decisaoParcial: decisaoParcialItem ?? undefined,
      produtoNome: data.produto?.nome ?? undefined,
      responsavelNome: data.responsavel?.nome ?? undefined,
      criadoPorNome: data.criado_por?.nome ?? undefined,
    });
  }

  private buildPersistencePayload(discovery: Discovery): {
    createData: Prisma.DiscoveryUncheckedCreateInput;
    updateData: Prisma.DiscoveryUncheckedUpdateInput;
    relations: { comoIdentificado: string[]; publicoAfetado: string[] };
  } {
    const statusItem = discovery.status.toCatalogItem();
    const severidadeItem = discovery.severidade.toCatalogItem();
    const decisaoParcialItem = discovery.decisaoParcial;

    const evolucaoLog = this.serializeEvolucaoLog(
      discovery.evolucaoLog as DiscoveryEvolucaoLogEntry[],
    );

    const base = {
      titulo: discovery.titulo,
      descricao: discovery.descricao,
      contexto: discovery.contexto ?? null,
      status_id: BigInt(statusItem.id),
      severidade_id: BigInt(severidadeItem.id),
      decisao_parcial_id: decisaoParcialItem ? BigInt(decisaoParcialItem.id) : null,
      responsavel_id: BigInt(discovery.responsavelId.getValue()),
      produto_id: BigInt(discovery.produtoId.getValue()),
      evolucao_log: evolucaoLog,
      deleted_at: discovery.deletedAt ?? null,
    };

    return {
      createData: {
        id_tenant: BigInt(discovery.tenantId.getValue()),
        id_demanda: BigInt(discovery.demandaId.getValue()),
        criado_por_id: BigInt(discovery.criadoPorId.getValue()),
        ...base,
      },
      updateData: {
        ...base,
      },
      relations: {
        comoIdentificado: discovery.comoIdentificado,
        publicoAfetado: discovery.publicoAfetado,
      },
    };
  }

  private mapCatalogItem(prismaItem?: CatalogItemWithCategory | null): CatalogItemVO | null {
    if (!prismaItem) {
      return null;
    }

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
    });
  }

  private normalizeCatalogValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private tryParseBigInt(value: string): bigint | undefined {
    if (/^\d+$/.test(value)) {
      try {
        return BigInt(value);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private async resolveCatalogItem(
    tenantId: string,
    categorySlug: string,
    value: string,
  ): Promise<CatalogItemVO> {
    const trimmed = value?.toString().trim();
    if (!trimmed) {
      throw new Error(`Valor de catálogo inválido para categoria ${categorySlug}`);
    }

    const slugCandidate = this.normalizeCatalogValue(trimmed);
    const legacyCandidate = trimmed.toUpperCase();
    const numericId = this.tryParseBigInt(trimmed);

    const orFilters: Prisma.CatalogItemWhereInput[] = [{ slug: slugCandidate }];

    if (legacyCandidate) {
      orFilters.push({
        metadados: {
          path: ['legacyValue'],
          equals: legacyCandidate,
        },
      });
    }

    if (numericId !== undefined) {
      orFilters.push({ id: numericId });
    }

    const record = await this.prisma.catalogItem.findFirst({
      where: {
        tenant_id: BigInt(tenantId),
        categoria: { slug: categorySlug },
        OR: orFilters,
      },
      include: {
        categoria: true,
      },
    });

    if (!record) {
      throw new Error(
        `Item de catálogo não encontrado (categoria=${categorySlug}, valor=${value})`,
      );
    }

    return CatalogItemVO.create({
      id: record.id.toString(),
      tenantId: record.tenant_id.toString(),
      categorySlug: record.categoria.slug,
      slug: record.slug,
      label: record.label,
      ordem: record.ordem,
      ativo: record.ativo,
      metadata: (record.metadados as Prisma.JsonObject | null) ?? null,
      produtoId: record.produto_id ? record.produto_id.toString() : null,
    });
  }

  private async syncDiscoveryCatalogRelations(params: {
    discoveryId: bigint;
    tenantId: string;
    categorySlug: string;
    values: string[];
    relation: 'identificacoes' | 'publicos';
  }): Promise<void> {
    const uniqueValues = Array.from(
      new Set(
        (params.values ?? [])
          .map((value) => value?.toString().trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    if (params.relation === 'identificacoes') {
      await this.prisma.discoveryIdentificacao.deleteMany({
        where: { discovery_id: params.discoveryId },
      });
    } else {
      await this.prisma.discoveryPublico.deleteMany({
        where: { discovery_id: params.discoveryId },
      });
    }

    if (uniqueValues.length === 0) {
      return;
    }

    const items = await Promise.all(
      uniqueValues.map((value) =>
        this.resolveCatalogItem(params.tenantId, params.categorySlug, value),
      ),
    );

    // Buscar id_tenant do discovery
    const discovery = await this.prisma.discovery.findUnique({
      where: { id: BigInt(params.discoveryId) },
      select: { id_tenant: true },
    });

    if (!discovery) {
      throw new Error(`Discovery ${params.discoveryId} não encontrada`);
    }

    const data = items.map((item) => ({
      discovery_id: params.discoveryId,
      id_tenant: discovery.id_tenant,
      catalog_item_id: BigInt(item.id),
    }));

    if (params.relation === 'identificacoes') {
      await this.prisma.discoveryIdentificacao.createMany({
        data,
        skipDuplicates: true,
      });
    } else {
      await this.prisma.discoveryPublico.createMany({
        data,
        skipDuplicates: true,
      });
    }
  }

  private serializeEvolucaoLog(
    log: DiscoveryEvolucaoLogEntry[],
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (!log || log.length === 0) {
      return Prisma.JsonNull;
    }

    const serialized = log.map((entry) => ({
      tipo: entry.tipo,
      dados: entry.dados,
      timestamp:
        entry.timestamp instanceof Date
          ? entry.timestamp.toISOString()
          : new Date(entry.timestamp).toISOString(),
    }));

    return serialized as unknown as Prisma.InputJsonValue;
  }

  private deserializeEvolucaoLog(value: Prisma.JsonValue | null): DiscoveryEvolucaoLogEntry[] {
    if (!value || (value as any) === Prisma.JsonNull) {
      return [];
    }

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const record = item as Record<string, unknown>;
        const tipo = typeof record.tipo === 'string' ? record.tipo : 'desconhecido';
        const dados =
          record.dados && typeof record.dados === 'object'
            ? (record.dados as Record<string, unknown>)
            : {};
        const timestampRaw =
          typeof record.timestamp === 'string' ? record.timestamp : new Date().toISOString();
        return {
          tipo,
          dados,
          timestamp: new Date(timestampRaw),
        };
      })
      .filter((entry): entry is DiscoveryEvolucaoLogEntry => entry !== null);
  }

  private catalogIncludes(): DiscoveryIncludeShape {
    return {
      status: { include: { categoria: true } },
      severidade: { include: { categoria: true } },
      decisao_parcial: { include: { categoria: true } },
      identificacoes: { include: { catalogo: { include: { categoria: true } } } },
      publicos: { include: { catalogo: { include: { categoria: true } } } },
      produto: true,
      responsavel: { select: { nome: true } },
      criado_por: { select: { nome: true } },
    };
  }
}
