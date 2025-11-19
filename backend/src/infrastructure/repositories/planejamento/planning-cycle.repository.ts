import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import {
  PlanningCycle,
  PlanningCycleStatusVO,
  QuarterVO,
  ChecklistEntry,
} from '@domain/planejamento';
import { IPlanningCycleRepository } from './planning-cycle.repository.interface';
import { Prisma } from '@prisma/client';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const planningCycleInclude = {
  status: {
    include: {
      categoria: true,
    },
  },
} satisfies Prisma.PlanningCycleInclude;

@Injectable()
export class PlanningCyclePrismaRepository implements IPlanningCycleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(cycle: PlanningCycle): Promise<string> {
    const obj = cycle.toObject();
    const checklistJson =
      obj.checklist && obj.checklist.length > 0
        ? (obj.checklist as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const dadosPreparacaoJson =
      obj.dadosPreparacao !== undefined && obj.dadosPreparacao !== null
        ? (obj.dadosPreparacao as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const data = {
      id_tenant: BigInt(obj.tenantId),
      produto_id: obj.produtoId ? BigInt(obj.produtoId) : undefined,
      quarter: obj.quarter.getValue(),
      status_id: BigInt(obj.status.id),
      fase_atual: obj.faseAtual,
      checklist: checklistJson,
      agenda_url: obj.agendaUrl ?? undefined,
      participantes_confirmados: obj.participantesConfirmados ?? undefined,
      participantes_totais: obj.participantesTotais ?? undefined,
      dados_preparacao: dadosPreparacaoJson,
      iniciado_em: obj.iniciadoEm ?? undefined,
      finalizado_em: obj.finalizadoEm ?? undefined,
    };

    if (obj.id) {
      await this.prisma.planningCycle.update({
        where: { id: BigInt(obj.id) },
        data,
      });
      return obj.id;
    }

    const created = await this.prisma.planningCycle.create({
      data,
    });
    return created.id.toString();
  }

  async findById(id: string, tenantId: string): Promise<PlanningCycle | null> {
    const record = await this.prisma.planningCycle.findFirst({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
      },
      include: planningCycleInclude,
    });

    return record ? this.toDomain(record) : null;
  }

  async findActiveByQuarter(tenantId: string, quarter: string): Promise<PlanningCycle | null> {
    const record = await this.prisma.planningCycle.findFirst({
      where: {
        id_tenant: BigInt(tenantId),
        quarter,
      },
      orderBy: { created_at: 'desc' },
      include: planningCycleInclude,
    });

    return record ? this.toDomain(record) : null;
  }

  async list(
    tenantId: string,
    filters?: { quarter?: string; produtoId?: string },
  ): Promise<PlanningCycle[]> {
    const rows = await this.prisma.planningCycle.findMany({
      where: {
        id_tenant: BigInt(tenantId),
        quarter: filters?.quarter,
        produto_id: filters?.produtoId ? BigInt(filters.produtoId) : undefined,
      },
      orderBy: { created_at: 'desc' },
      include: planningCycleInclude,
    });

    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.planningCycle.deleteMany({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
      },
    });
  }

  private toDomain(
    record: Prisma.PlanningCycleGetPayload<{ include: typeof planningCycleInclude }>,
  ): PlanningCycle {
    return PlanningCycle.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      produtoId: record.produto_id?.toString(),
      quarter: QuarterVO.create(record.quarter),
      status: PlanningCycleStatusVO.fromCatalogItem(this.mapCatalogItem(record.status)),
      faseAtual: record.fase_atual,
      checklist: this.deserializeChecklist(record.checklist),
      agendaUrl: record.agenda_url ?? undefined,
      participantesConfirmados: record.participantes_confirmados ?? undefined,
      participantesTotais: record.participantes_totais ?? undefined,
      dadosPreparacao: this.deserializeDadosPreparacao(record.dados_preparacao),
      iniciadoEm: record.iniciado_em ?? undefined,
      finalizadoEm: record.finalizado_em ?? undefined,
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

  private deserializeChecklist(raw: Prisma.JsonValue | null): ChecklistEntry[] {
    if (!raw || Object.is(raw, Prisma.JsonNull) || !Array.isArray(raw)) {
      return [];
    }

    const entries: ChecklistEntry[] = [];

    for (const item of raw) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }

      const record = item as Record<string, unknown>;
      const chave = typeof record.chave === 'string' ? record.chave : undefined;
      const label = typeof record.label === 'string' ? record.label : undefined;
      const concluido = typeof record.concluido === 'boolean' ? record.concluido : undefined;

      if (!chave || !label || concluido === undefined) {
        continue;
      }

      const entry: ChecklistEntry = {
        chave,
        label,
        concluido,
      };

      if (typeof record.responsavel === 'string') {
        entry.responsavel = record.responsavel;
      }

      entries.push(entry);
    }

    return entries;
  }

  private deserializeDadosPreparacao(
    raw: Prisma.JsonValue | null,
  ): Record<string, unknown> | undefined {
    if (raw === null) {
      return undefined;
    }

    if (Object.is(raw, Prisma.JsonNull)) {
      return undefined;
    }

    if (typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }

    return undefined;
  }
}
