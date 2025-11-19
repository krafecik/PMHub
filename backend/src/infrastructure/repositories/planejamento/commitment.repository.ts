import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { Prisma } from '@prisma/client';
import {
  Commitment,
  CommitmentItem,
  CommitmentTierVO,
  QuarterVO,
  ListarCommitmentsFiltro,
} from '@domain/planejamento';
import { IPlanejamentoCommitmentRepository } from './commitment.repository.interface';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const commitmentInclude = {
  committed_item: {
    include: {
      categoria: true,
    },
  },
  targeted_item: {
    include: {
      categoria: true,
    },
  },
  aspirational_item: {
    include: {
      categoria: true,
    },
  },
} satisfies Prisma.PlanejamentoCommitmentInclude;

@Injectable()
export class PlanejamentoCommitmentRepository implements IPlanejamentoCommitmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(commitment: Commitment): Promise<void> {
    const obj = commitment.toPersistence();

    const committedEpicos = obj.itens.committed ?? [];
    const targetedEpicos = obj.itens.targeted ?? [];
    const aspirationalEpicos = obj.itens.aspirational ?? [];

    const serializedAssinaturas = (obj.assinaturas ?? []).map((assinatura) => ({
      ...assinatura,
      assinadoEm: assinatura.assinadoEm.toISOString(),
    }));

    const data: Prisma.PlanejamentoCommitmentUncheckedCreateInput = {
      id_tenant: BigInt(obj.tenantId),
      produto_id: BigInt(obj.produtoId),
      planning_cycle_id: obj.planningCycleId ? BigInt(obj.planningCycleId) : undefined,
      quarter: obj.quarter.getValue(),
      committed_item_id: BigInt(obj.tiers.committed.id),
      targeted_item_id: BigInt(obj.tiers.targeted.id),
      aspirational_item_id: BigInt(obj.tiers.aspirational.id),
      committed_epicos:
        committedEpicos.length > 0
          ? (committedEpicos as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      targeted_epicos:
        targetedEpicos.length > 0
          ? (targetedEpicos as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      aspirational_epicos:
        aspirationalEpicos.length > 0
          ? (aspirationalEpicos as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      assinaturas:
        serializedAssinaturas.length > 0
          ? (serializedAssinaturas as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      documento_url: obj.documentoUrl ?? undefined,
    };

    if (obj.id) {
      await this.prisma.planejamentoCommitment.update({
        where: { id: BigInt(obj.id) },
        data,
      });
      return;
    }

    await this.prisma.planejamentoCommitment.upsert({
      where: {
        produto_id_quarter: {
          produto_id: BigInt(obj.produtoId),
          quarter: obj.quarter.getValue(),
        },
      },
      update: data,
      create: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<Commitment | null> {
    const record = await this.prisma.planejamentoCommitment.findFirst({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
      },
      include: commitmentInclude,
    });

    return record ? this.toDomain(record) : null;
  }

  async findByQuarter(
    tenantId: string,
    produtoId: string,
    quarter: string,
  ): Promise<Commitment | null> {
    const record = await this.prisma.planejamentoCommitment.findFirst({
      where: {
        id_tenant: BigInt(tenantId),
        produto_id: BigInt(produtoId),
        quarter,
      },
      include: commitmentInclude,
    });

    return record ? this.toDomain(record) : null;
  }

  async listAll(filter: ListarCommitmentsFiltro): Promise<Commitment[]> {
    const where: any = {
      id_tenant: BigInt(filter.tenantId),
    };

    if (filter.produtoId) {
      where.produto_id = BigInt(filter.produtoId);
    }

    if (filter.quarter) {
      where.quarter = filter.quarter;
    }

    if (filter.planningCycleId) {
      where.planning_cycle_id = BigInt(filter.planningCycleId);
    }

    const records = await this.prisma.planejamentoCommitment.findMany({
      where,
      include: commitmentInclude,
      orderBy: [{ quarter: 'desc' }, { created_at: 'desc' }],
    });

    return records.map((record) => this.toDomain(record));
  }

  private toDomain(
    record: Prisma.PlanejamentoCommitmentGetPayload<{ include: typeof commitmentInclude }>,
  ): Commitment {
    const tiers = {
      committed: CommitmentTierVO.fromCatalogItem(this.mapCatalogItem(record.committed_item)),
      targeted: CommitmentTierVO.fromCatalogItem(this.mapCatalogItem(record.targeted_item)),
      aspirational: CommitmentTierVO.fromCatalogItem(this.mapCatalogItem(record.aspirational_item)),
    };

    return Commitment.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      produtoId: record.produto_id.toString(),
      planningCycleId: record.planning_cycle_id?.toString(),
      quarter: QuarterVO.create(record.quarter),
      tiers,
      itens: {
        committed: this.parseCommitmentItems(record.committed_epicos),
        targeted: this.parseCommitmentItems(record.targeted_epicos),
        aspirational: this.parseCommitmentItems(record.aspirational_epicos),
      },
      assinaturas: this.deserializeAssinaturas(record.assinaturas),
      documentoUrl: record.documento_url ?? undefined,
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
    });
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

  private deserializeAssinaturas(
    raw: Prisma.JsonValue | null,
  ): { papel: string; usuarioId: string; assinadoEm: Date }[] {
    if (!raw || !Array.isArray(raw)) {
      return [];
    }

    return raw
      .map((assinatura) => {
        if (typeof assinatura !== 'object' || assinatura === null) return null;
        const { papel, usuarioId, assinadoEm } = assinatura as Record<string, unknown>;
        if (typeof papel !== 'string' || typeof usuarioId !== 'string') return null;
        const data = typeof assinadoEm === 'string' ? new Date(assinadoEm) : new Date();
        return { papel, usuarioId, assinadoEm: data };
      })
      .filter(
        (assinatura): assinatura is { papel: string; usuarioId: string; assinadoEm: Date } =>
          assinatura !== null,
      );
  }

  private parseCommitmentItems(value: Prisma.JsonValue | null): CommitmentItem[] {
    if (!value || !Array.isArray(value)) {
      return [];
    }

    const itens: CommitmentItem[] = [];

    for (const entry of value) {
      if (typeof entry !== 'object' || entry === null) {
        continue;
      }

      const record = entry as Record<string, unknown>;
      const epicoId = typeof record.epicoId === 'string' ? record.epicoId : undefined;
      const titulo = typeof record.titulo === 'string' ? record.titulo : undefined;

      if (!epicoId || !titulo) {
        continue;
      }

      const item: CommitmentItem = {
        epicoId,
        titulo,
      };

      if (typeof record.squadId === 'string') {
        item.squadId = record.squadId;
      }
      if (typeof record.confianca === 'string') {
        item.confianca = record.confianca;
      }

      itens.push(item);
    }

    return itens;
  }
}
