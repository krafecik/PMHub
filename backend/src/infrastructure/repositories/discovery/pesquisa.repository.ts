import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Pesquisa } from '../../../domain/discovery/entities';
import { IPesquisaRepository, PesquisaFilters } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  PesquisaId,
  DiscoveryId,
  MetodoPesquisaVO,
  StatusPesquisaVO,
  StatusPesquisaEnum,
} from '../../../domain/discovery/value-objects';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { Prisma } from '@prisma/client';

type PesquisaCatalogInclude = {
  metodo: { include: { categoria: true } };
  status: { include: { categoria: true } };
};

type PesquisaWithCatalogRelations = Prisma.PesquisaGetPayload<{
  include: PesquisaCatalogInclude;
}>;

@Injectable()
export class PesquisaPrismaRepository implements IPesquisaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: TenantId, id: PesquisaId): Promise<Pesquisa | null> {
    const pesquisa = await this.prisma.pesquisa.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      include: this.includeRelations(),
    });

    if (!pesquisa) {
      return null;
    }

    return this.toDomain(pesquisa);
  }

  async findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Pesquisa[]> {
    const pesquisas = await this.prisma.pesquisa.findMany({
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

    return pesquisas.map((p) => this.toDomain(p));
  }

  async findAll(tenantId: TenantId, filters?: PesquisaFilters): Promise<Pesquisa[]> {
    const where: Prisma.PesquisaWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
    };

    if (filters?.discoveryId) {
      where.id_discovery = BigInt(filters.discoveryId);
    }

    if (filters?.status && filters.status.length > 0) {
      const statusSlugs = filters.status.map((status) => StatusPesquisaVO.enumToSlug(status));
      where.status = {
        is: {
          slug: { in: statusSlugs },
        },
      };
    }

    if (filters?.metodo && filters.metodo.length > 0) {
      where.metodo = {
        is: {
          slug: { in: filters.metodo.map(normalizeCatalogSlug) },
        },
      };
    }

    const pesquisas = await this.prisma.pesquisa.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return pesquisas.map((p) => this.toDomain(p));
  }

  async save(pesquisa: Pesquisa): Promise<Pesquisa> {
    const data = this.toPersistence(pesquisa);

    const created = await this.prisma.pesquisa.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(created);
  }

  async update(pesquisa: Pesquisa): Promise<Pesquisa> {
    if (!pesquisa.id) {
      throw new Error('Pesquisa ID é obrigatório para atualização');
    }

    const data = this.toPersistence(pesquisa);

    const updated = await this.prisma.pesquisa.update({
      where: { id: BigInt(pesquisa.id.getValue()) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(updated);
  }

  async delete(tenantId: TenantId, id: PesquisaId): Promise<void> {
    await this.prisma.pesquisa.update({
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
    status: StatusPesquisaEnum,
  ): Promise<number> {
    return this.prisma.pesquisa.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        status: {
          is: {
            slug: StatusPesquisaVO.enumToSlug(status),
          },
        },
        deleted_at: null,
      },
    });
  }

  async countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number> {
    return this.prisma.pesquisa.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        deleted_at: null,
      },
    });
  }

  private toDomain(data: PesquisaWithCatalogRelations): Pesquisa {
    return Pesquisa.fromPersistence({
      id: data.id ? new PesquisaId(data.id.toString()) : undefined,
      tenantId: new TenantId(data.id_tenant.toString()),
      discoveryId: new DiscoveryId(data.id_discovery.toString()),
      titulo: data.titulo,
      metodo: MetodoPesquisaVO.fromCatalogItem(this.mapCatalogItem(data.metodo)),
      objetivo: data.objetivo,
      roteiroUrl: data.roteiro_url ?? undefined,
      status: StatusPesquisaVO.fromCatalogItem(this.mapCatalogItem(data.status)),
      totalParticipantes: data.total_participantes,
      participantesConcluidos: data.participantes_concluidos,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    });
  }

  private toPersistence(pesquisa: Pesquisa): Prisma.PesquisaUncheckedCreateInput {
    const metodoItem = pesquisa.metodo.toCatalogItem();
    const statusItem = pesquisa.status.toCatalogItem();

    return {
      id_tenant: BigInt(pesquisa.tenantId.getValue()),
      id_discovery: BigInt(pesquisa.discoveryId.getValue()),
      titulo: pesquisa.titulo,
      metodo_id: BigInt(metodoItem.id),
      objetivo: pesquisa.objetivo,
      roteiro_url: pesquisa.roteiroUrl ?? null,
      status_id: BigInt(statusItem.id),
      total_participantes: pesquisa.totalParticipantes,
      participantes_concluidos: pesquisa.participantesConcluidos,
      deleted_at: pesquisa.deletedAt ?? null,
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

  private includeRelations(): PesquisaCatalogInclude {
    return {
      metodo: { include: { categoria: true } },
      status: { include: { categoria: true } },
    };
  }
}

const normalizeCatalogSlug = (value: string): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
