import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Hipotese } from '../../../domain/discovery/entities';
import { IHipoteseRepository, HipoteseFilters } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  HipoteseId,
  DiscoveryId,
  StatusHipoteseVO,
  StatusHipoteseEnum,
  ImpactoHipoteseVO,
  PrioridadeHipoteseVO,
} from '../../../domain/discovery/value-objects';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { Prisma } from '@prisma/client';

type HipoteseCatalogInclude = {
  impacto: { include: { categoria: true } };
  prioridade: { include: { categoria: true } };
  status: { include: { categoria: true } };
};

type HipoteseWithCatalogRelations = Prisma.HipoteseGetPayload<{
  include: HipoteseCatalogInclude;
}>;

@Injectable()
export class HipotesePrismaRepository implements IHipoteseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: TenantId, id: HipoteseId): Promise<Hipotese | null> {
    const hipotese = await this.prisma.hipotese.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      include: this.includeRelations(),
    });

    if (!hipotese) {
      return null;
    }

    return this.toDomain(hipotese);
  }

  async findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Hipotese[]> {
    const hipoteses = await this.prisma.hipotese.findMany({
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

    return hipoteses.map((h) => this.toDomain(h));
  }

  async findAll(tenantId: TenantId, filters?: HipoteseFilters): Promise<Hipotese[]> {
    const where: Prisma.HipoteseWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
    };

    if (filters?.discoveryId) {
      where.id_discovery = BigInt(filters.discoveryId);
    }

    if (filters?.status && filters.status.length > 0) {
      const statusSlugs = filters.status.map((status) => StatusHipoteseVO.enumToSlug(status));
      where.status = {
        is: {
          slug: { in: statusSlugs },
        },
      };
    }

    if (filters?.prioridade && filters.prioridade.length > 0) {
      where.prioridade = {
        is: {
          slug: { in: filters.prioridade.map(normalizeValue) },
        },
      };
    }

    if (filters?.impactoEsperado && filters.impactoEsperado.length > 0) {
      where.impacto = {
        is: {
          slug: { in: filters.impactoEsperado.map(normalizeValue) },
        },
      };
    }

    const hipoteses = await this.prisma.hipotese.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return hipoteses.map((h) => this.toDomain(h));
  }

  async save(hipotese: Hipotese): Promise<Hipotese> {
    const data = await this.toPersistence(hipotese);

    const created = await this.prisma.hipotese.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(created);
  }

  async update(hipotese: Hipotese): Promise<Hipotese> {
    if (!hipotese.id) {
      throw new Error('Hipótese ID é obrigatório para atualização');
    }

    const data = await this.toPersistence(hipotese);

    const updated = await this.prisma.hipotese.update({
      where: { id: BigInt(hipotese.id.getValue()) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(updated);
  }

  async delete(tenantId: TenantId, id: HipoteseId): Promise<void> {
    await this.prisma.hipotese.update({
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
    status: StatusHipoteseEnum,
  ): Promise<number> {
    return this.prisma.hipotese.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        status: {
          is: {
            slug: StatusHipoteseVO.enumToSlug(status),
          },
        },
        deleted_at: null,
      },
    });
  }

  async countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number> {
    return this.prisma.hipotese.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        deleted_at: null,
      },
    });
  }

  private toDomain(data: HipoteseWithCatalogRelations): Hipotese {
    const impactoItem = this.mapCatalogItem(data.impacto);
    const prioridadeItem = this.mapCatalogItem(data.prioridade);
    const statusItem = this.mapCatalogItem(data.status);

    return Hipotese.fromPersistence({
      id: data.id ? new HipoteseId(data.id.toString()) : undefined,
      tenantId: new TenantId(data.id_tenant.toString()),
      discoveryId: new DiscoveryId(data.id_discovery.toString()),
      titulo: data.titulo,
      descricao: data.descricao,
      comoValidar: data.como_validar,
      metricaAlvo: data.metrica_alvo ?? undefined,
      impactoEsperado: ImpactoHipoteseVO.fromCatalogItem(impactoItem),
      prioridade: PrioridadeHipoteseVO.fromCatalogItem(prioridadeItem),
      status: StatusHipoteseVO.fromCatalogItem(statusItem),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    });
  }

  private toPersistence(hipotese: Hipotese): Prisma.HipoteseUncheckedCreateInput {
    const impactoItem = hipotese.impactoEsperado.toCatalogItem();
    const prioridadeItem = hipotese.prioridade.toCatalogItem();
    const statusItem = hipotese.status.toCatalogItem();

    return {
      id_tenant: BigInt(hipotese.tenantId.getValue()),
      id_discovery: BigInt(hipotese.discoveryId.getValue()),
      titulo: hipotese.titulo,
      descricao: hipotese.descricao,
      como_validar: hipotese.comoValidar,
      metrica_alvo: hipotese.metricaAlvo ?? null,
      impacto_id: BigInt(impactoItem.id),
      prioridade_id: BigInt(prioridadeItem.id),
      status_id: BigInt(statusItem.id),
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

  private includeRelations(): HipoteseCatalogInclude {
    return {
      impacto: { include: { categoria: true } },
      prioridade: { include: { categoria: true } },
      status: { include: { categoria: true } },
    };
  }
}

const normalizeValue = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
