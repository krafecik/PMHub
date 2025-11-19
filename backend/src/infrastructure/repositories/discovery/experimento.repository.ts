import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Experimento } from '../../../domain/discovery/entities';
import { IExperimentoRepository, ExperimentoFilters } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  ExperimentoId,
  DiscoveryId,
  HipoteseId,
  StatusExperimentoVO,
  StatusExperimentoEnum,
  TipoExperimentoVO,
  MetricaSucessoExperimentoVO,
} from '../../../domain/discovery/value-objects';
import { Prisma } from '@prisma/client';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

type ExperimentoCatalogInclude = {
  tipo: { include: { categoria: true } };
  status: { include: { categoria: true } };
  metrica_catalogo: { include: { categoria: true } };
};

type ExperimentoWithCatalogRelations = Prisma.ExperimentoGetPayload<{
  include: ExperimentoCatalogInclude;
}>;

@Injectable()
export class ExperimentoPrismaRepository implements IExperimentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: TenantId, id: ExperimentoId): Promise<Experimento | null> {
    const experimento = await this.prisma.experimento.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      include: this.includeRelations(),
    });

    if (!experimento) {
      return null;
    }

    return this.toDomain(experimento);
  }

  async findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Experimento[]> {
    const experimentos = await this.prisma.experimento.findMany({
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

    return experimentos.map((e) => this.toDomain(e));
  }

  async findByHipotese(tenantId: TenantId, hipoteseId: HipoteseId): Promise<Experimento[]> {
    const experimentos = await this.prisma.experimento.findMany({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_hipotese: BigInt(hipoteseId.getValue()),
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return experimentos.map((e) => this.toDomain(e));
  }

  async findAll(tenantId: TenantId, filters?: ExperimentoFilters): Promise<Experimento[]> {
    const where: Prisma.ExperimentoWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
    };

    if (filters?.discoveryId) {
      where.id_discovery = BigInt(filters.discoveryId);
    }

    if (filters?.hipoteseId) {
      where.id_hipotese = BigInt(filters.hipoteseId);
    }

    if (filters?.status && filters.status.length > 0) {
      where.status = {
        is: {
          slug: { in: filters.status.map((status) => StatusExperimentoVO.enumToSlug(status)) },
        },
      };
    }

    if (filters?.tipo && filters.tipo.length > 0) {
      where.tipo = {
        is: {
          slug: { in: filters.tipo.map(normalizeCatalogSlug) },
        },
      };
    }

    const experimentos = await this.prisma.experimento.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return experimentos.map((e) => this.toDomain(e));
  }

  async save(experimento: Experimento): Promise<Experimento> {
    const data = await this.toPersistence(experimento);

    const created = await this.prisma.experimento.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(created);
  }

  async update(experimento: Experimento): Promise<Experimento> {
    if (!experimento.id) {
      throw new Error('Experimento ID é obrigatório para atualização');
    }

    const data = await this.toPersistence(experimento);

    const updated = await this.prisma.experimento.update({
      where: { id: BigInt(experimento.id.getValue()) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(updated);
  }

  async delete(tenantId: TenantId, id: ExperimentoId): Promise<void> {
    await this.prisma.experimento.update({
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
    status: StatusExperimentoEnum,
  ): Promise<number> {
    return this.prisma.experimento.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        status: {
          is: {
            slug: StatusExperimentoVO.enumToSlug(status),
          },
        },
        deleted_at: null,
      },
    });
  }

  async countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number> {
    return this.prisma.experimento.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        deleted_at: null,
      },
    });
  }

  private toDomain(data: ExperimentoWithCatalogRelations): Experimento {
    return Experimento.fromPersistence({
      id: data.id ? new ExperimentoId(data.id.toString()) : undefined,
      tenantId: new TenantId(data.id_tenant.toString()),
      discoveryId: new DiscoveryId(data.id_discovery.toString()),
      hipoteseId: data.id_hipotese ? new HipoteseId(data.id_hipotese.toString()) : undefined,
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: TipoExperimentoVO.fromCatalogItem(this.mapCatalogItem(data.tipo)),
      metricaSucesso: data.metrica_sucesso,
      metricaSucessoCatalogo: data.metrica_catalogo
        ? MetricaSucessoExperimentoVO.fromCatalogItem(this.mapCatalogItem(data.metrica_catalogo))
        : undefined,
      grupoControle: data.grupo_controle,
      grupoVariante: data.grupo_variante,
      resultados: data.resultados,
      pValue: data.p_value ?? undefined,
      status: StatusExperimentoVO.fromCatalogItem(this.mapCatalogItem(data.status)),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    });
  }

  private toPersistence(experimento: Experimento): Prisma.ExperimentoUncheckedCreateInput {
    const tipoItem = experimento.tipo.toCatalogItem();
    const statusItem = experimento.status.toCatalogItem();
    const metricaItem = experimento.metricaSucessoCatalogo?.toCatalogItem();

    return {
      id_tenant: BigInt(experimento.tenantId.getValue()),
      id_discovery: BigInt(experimento.discoveryId.getValue()),
      id_hipotese: experimento.hipoteseId ? BigInt(experimento.hipoteseId.getValue()) : null,
      titulo: experimento.titulo,
      descricao: experimento.descricao,
      tipo_id: BigInt(tipoItem.id),
      metrica_sucesso: experimento.metricaSucesso,
      metrica_sucesso_id: metricaItem ? BigInt(metricaItem.id) : null,
      grupo_controle: this.toJsonInput(experimento.grupoControle),
      grupo_variante: this.toJsonInput(experimento.grupoVariante),
      resultados: this.toJsonInput(experimento.resultados),
      p_value: experimento.pValue ?? null,
      status_id: BigInt(statusItem.id),
      deleted_at: experimento.deletedAt ?? null,
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

  private includeRelations(): ExperimentoCatalogInclude {
    return {
      tipo: { include: { categoria: true } },
      status: { include: { categoria: true } },
      metrica_catalogo: { include: { categoria: true } },
    };
  }

  private toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }

    return value as unknown as Prisma.InputJsonValue;
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
