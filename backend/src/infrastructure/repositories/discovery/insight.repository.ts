import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Insight } from '../../../domain/discovery/entities';
import { IInsightRepository, InsightFilters } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  InsightId,
  DiscoveryId,
  EntrevistaId,
  StatusInsightVO,
  StatusInsightEnum,
  ImpactoInsightVO,
  ConfiancaInsightVO,
} from '../../../domain/discovery/value-objects';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { Prisma } from '@prisma/client';

type InsightCatalogInclude = {
  impacto: { include: { categoria: true } };
  confianca: { include: { categoria: true } };
  status: { include: { categoria: true } };
};

type InsightWithCatalogRelations = Prisma.InsightGetPayload<{
  include: InsightCatalogInclude;
}>;

@Injectable()
export class InsightPrismaRepository implements IInsightRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: TenantId, id: InsightId): Promise<Insight | null> {
    const insight = await this.prisma.insight.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      include: this.includeRelations(),
    });

    if (!insight) {
      return null;
    }

    return this.toDomain(insight);
  }

  async findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Insight[]> {
    const insights = await this.prisma.insight.findMany({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return insights.map((i) => this.toDomain(i));
  }

  async findByEntrevista(tenantId: TenantId, entrevistaId: EntrevistaId): Promise<Insight[]> {
    const insights = await this.prisma.insight.findMany({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_entrevista: BigInt(entrevistaId.getValue()),
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return insights.map((i) => this.toDomain(i));
  }

  async findAll(tenantId: TenantId, filters?: InsightFilters): Promise<Insight[]> {
    const where: Prisma.InsightWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
    };

    if (filters?.discoveryId) {
      where.id_discovery = BigInt(filters.discoveryId);
    }

    if (filters?.entrevistaId) {
      where.id_entrevista = BigInt(filters.entrevistaId);
    }

    if (filters?.status && filters.status.length > 0) {
      where.status = {
        is: {
          slug: { in: filters.status.map((status) => StatusInsightVO.enumToSlug(status)) },
        },
      };
    }

    if (filters?.impacto && filters.impacto.length > 0) {
      where.impacto = {
        is: {
          slug: { in: filters.impacto.map(normalizeCatalogSlug) },
        },
      };
    }

    if (filters?.confianca && filters.confianca.length > 0) {
      where.confianca = {
        is: {
          slug: { in: filters.confianca.map(normalizeCatalogSlug) },
        },
      };
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const insights = await this.prisma.insight.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return insights.map((i) => this.toDomain(i));
  }

  async findRelatedByTags(
    tenantId: TenantId,
    tags: string[],
    excludeDiscoveryId?: DiscoveryId,
  ): Promise<Insight[]> {
    const where: Prisma.InsightWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
      tags: {
        hasSome: tags,
      },
    };

    if (excludeDiscoveryId) {
      where.id_discovery = {
        not: BigInt(excludeDiscoveryId.getValue()),
      };
    }

    const insights = await this.prisma.insight.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      take: 20, // Limit results
      include: this.includeRelations(),
    });

    return insights.map((i) => this.toDomain(i));
  }

  async save(insight: Insight): Promise<Insight> {
    const data = await this.toPersistence(insight);

    const created = await this.prisma.insight.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(created);
  }

  async update(insight: Insight): Promise<Insight> {
    if (!insight.id) {
      throw new Error('Insight ID é obrigatório para atualização');
    }

    const data = await this.toPersistence(insight);

    const updated = await this.prisma.insight.update({
      where: { id: BigInt(insight.id.getValue()) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(updated);
  }

  async delete(tenantId: TenantId, id: InsightId): Promise<void> {
    await this.prisma.insight.update({
      where: { id: BigInt(id.getValue()) },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async countByStatus(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
    status: StatusInsightEnum,
  ): Promise<number> {
    return this.prisma.insight.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        status: {
          is: {
            slug: StatusInsightVO.enumToSlug(status),
          },
        },
        deleted_at: null,
      },
    });
  }

  async countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number> {
    return this.prisma.insight.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        deleted_at: null,
      },
    });
  }

  private toDomain(data: InsightWithCatalogRelations): Insight {
    return Insight.fromPersistence({
      id: data.id ? new InsightId(data.id.toString()) : undefined,
      tenantId: new TenantId(data.id_tenant.toString()),
      discoveryId: new DiscoveryId(data.id_discovery.toString()),
      entrevistaId: data.id_entrevista
        ? new EntrevistaId(data.id_entrevista.toString())
        : undefined,
      descricao: data.descricao,
      impacto: ImpactoInsightVO.fromCatalogItem(this.mapCatalogItem(data.impacto)),
      confianca: ConfiancaInsightVO.fromCatalogItem(this.mapCatalogItem(data.confianca)),
      status: StatusInsightVO.fromCatalogItem(this.mapCatalogItem(data.status)),
      tags: data.tags || [],
      evidenciasIds: data.evidencias_ids?.map((id: bigint) => id.toString()) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    });
  }

  private toPersistence(insight: Insight): Prisma.InsightUncheckedCreateInput {
    const impactoItem = insight.impacto.toCatalogItem();
    const confiancaItem = insight.confianca.toCatalogItem();
    const statusItem = insight.status.toCatalogItem();

    return {
      id_tenant: BigInt(insight.tenantId.getValue()),
      id_discovery: BigInt(insight.discoveryId.getValue()),
      id_entrevista: insight.entrevistaId ? BigInt(insight.entrevistaId.getValue()) : null,
      descricao: insight.descricao,
      impacto_id: BigInt(impactoItem.id),
      confianca_id: BigInt(confiancaItem.id),
      status_id: BigInt(statusItem.id),
      tags: insight.tags,
      evidencias_ids: insight.evidenciasIds.map((id) => BigInt(id)),
      deleted_at: insight.deletedAt ?? null,
    };
  }

  private mapCatalogItem(
    prismaItem?: Prisma.CatalogItemGetPayload<{ include: { categoria: true } }> | null,
  ): CatalogItemVO {
    if (!prismaItem) {
      throw new Error('Item de catálogo obrigatório não encontrado');
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

  private includeRelations(): InsightCatalogInclude {
    return {
      impacto: { include: { categoria: true } },
      confianca: { include: { categoria: true } },
      status: { include: { categoria: true } },
    };
  }
}

const normalizeCatalogSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
