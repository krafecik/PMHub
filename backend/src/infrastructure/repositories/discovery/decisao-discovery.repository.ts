import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IDecisaoDiscoveryRepository } from '../../../domain/discovery/repositories';
import { DecisaoDiscovery } from '../../../domain/discovery/entities';
import { DecisaoDiscoveryId, DiscoveryId } from '../../../domain/discovery/value-objects';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import { Prisma } from '@prisma/client';

type DecisaoDiscoveryWithRelations = Prisma.DecisaoDiscoveryGetPayload<{
  include: {
    status_final: { include: { categoria: true } };
  };
}>;

@Injectable()
export class DecisaoDiscoveryPrismaRepository implements IDecisaoDiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDiscovery(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
  ): Promise<DecisaoDiscovery | null> {
    const record = await this.prisma.decisaoDiscovery.findFirst({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
      },
      include: this.includeRelations(),
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findById(tenantId: TenantId, id: DecisaoDiscoveryId): Promise<DecisaoDiscovery | null> {
    const record = await this.prisma.decisaoDiscovery.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
      },
      include: this.includeRelations(),
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async upsert(decisao: DecisaoDiscovery): Promise<DecisaoDiscovery> {
    const persistence = this.toPersistence(decisao);
    const { id_tenant: _tenant, created_at: _createdAt, ...updateData } = persistence;

    const record = await this.prisma.decisaoDiscovery.upsert({
      where: {
        id_discovery: BigInt(decisao.discoveryId.getValue()),
      },
      create: persistence,
      update: {
        ...updateData,
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(record);
  }

  private toDomain(record: DecisaoDiscoveryWithRelations): DecisaoDiscovery {
    const statusItem = this.mapCatalogItem(record.status_final);

    return DecisaoDiscovery.fromPersistence({
      id: new DecisaoDiscoveryId(record.id.toString()),
      tenantId: new TenantId(record.id_tenant.toString()),
      discoveryId: new DiscoveryId(record.id_discovery.toString()),
      statusFinal: statusItem,
      resumo: record.resumo,
      aprendizados: record.aprendizados ?? [],
      recomendacoes: record.recomendacoes ?? [],
      proximosPassos: record.proximos_passos ?? [],
      materiaisAnexos: (record.materiais_anexos as Record<string, unknown> | null) ?? null,
      decididoPorId: new UserId(record.decidido_por_id.toString()),
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
    });
  }

  private toPersistence(decisao: DecisaoDiscovery): Prisma.DecisaoDiscoveryUncheckedCreateInput {
    const statusItem = decisao.statusFinal;
    const materiaisAnexos: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
      decisao.materiaisAnexos === null || decisao.materiaisAnexos === undefined
        ? Prisma.JsonNull
        : (decisao.materiaisAnexos as Prisma.InputJsonValue);

    return {
      id_tenant: BigInt(decisao.tenantId.getValue()),
      id_discovery: BigInt(decisao.discoveryId.getValue()),
      status_final_id: BigInt(statusItem.id),
      resumo: decisao.resumo,
      aprendizados: decisao.aprendizados,
      recomendacoes: decisao.recomendacoes,
      proximos_passos: decisao.proximosPassos,
      materiais_anexos: materiaisAnexos,
      decidido_por_id: BigInt(decisao.decididoPorId.getValue()),
      created_at: decisao.createdAt ?? new Date(),
      updated_at: decisao.updatedAt ?? new Date(),
    };
  }

  private mapCatalogItem(
    item: Prisma.CatalogItemGetPayload<{ include: { categoria: true } }>,
  ): CatalogItemVO {
    return CatalogItemVO.create({
      id: item.id.toString(),
      tenantId: item.tenant_id.toString(),
      categorySlug: item.categoria.slug,
      slug: item.slug,
      label: item.label,
      ordem: item.ordem,
      ativo: item.ativo,
      metadata: (item.metadados as Prisma.JsonObject | null) ?? null,
      produtoId: item.produto_id ? item.produto_id.toString() : null,
    });
  }

  private includeRelations() {
    return {
      status_final: { include: { categoria: true } },
    } as const;
  }
}
