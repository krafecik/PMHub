import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import {
  CenarioSimulado,
  CenarioStatusVO,
  QuarterVO,
  AjusteCapacidade,
  ResultadoCenario,
} from '@domain/planejamento';
import { IPlanejamentoCenarioRepository } from './cenario.repository.interface';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlanejamentoCenarioRepository implements IPlanejamentoCenarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(cenario: CenarioSimulado): Promise<string> {
    const obj = cenario.toObject();
    const data = {
      id_tenant: BigInt(obj.tenantId),
      planning_cycle_id: obj.planningCycleId ? BigInt(obj.planningCycleId) : undefined,
      quarter: obj.quarter.getValue(),
      nome: obj.nome,
      descricao: obj.descricao,
      status_id: BigInt(obj.status.id),
      ajustes_capacidade: this.toJsonInput(obj.ajustesCapacidade),
      incluir_contractors: obj.incluirContractors,
      considerar_ferias: obj.considerarFerias,
      buffer_risco_percentual: obj.bufferRiscoPercentual,
      resultado: this.toJsonInput(obj.resultado),
    };

    if (obj.id) {
      await this.prisma.planejamentoCenario.update({
        where: { id: BigInt(obj.id) },
        data,
      });
      return obj.id;
    }

    const created = await this.prisma.planejamentoCenario.create({ data });
    return created.id.toString();
  }

  async findById(id: string, tenantId: string): Promise<CenarioSimulado | null> {
    const record = await this.prisma.planejamentoCenario.findFirst({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
      },
      include: {
        status: {
          include: {
            categoria: true,
          },
        },
      },
    });

    return record ? this.toDomain(record) : null;
  }

  async listByQuarter(tenantId: string, quarter: string): Promise<CenarioSimulado[]> {
    const rows = await this.prisma.planejamentoCenario.findMany({
      where: {
        id_tenant: BigInt(tenantId),
        quarter,
      },
      include: {
        status: {
          include: {
            categoria: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(record: any): CenarioSimulado {
    const statusItem = this.mapCatalogItem(record.status);
    return CenarioSimulado.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      planningCycleId: record.planning_cycle_id?.toString(),
      quarter: QuarterVO.create(record.quarter),
      nome: record.nome,
      descricao: record.descricao ?? undefined,
      status: CenarioStatusVO.fromCatalogItem(statusItem),
      ajustesCapacidade: this.parseAjustes(record.ajustes_capacidade),
      incluirContractors: record.incluir_contractors,
      considerarFerias: record.considerar_ferias,
      bufferRiscoPercentual: record.buffer_risco_percentual,
      resultado: this.parseResultado(record.resultado),
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
    });
  }

  private mapCatalogItem(prismaItem: any): CatalogItemVO {
    if (!prismaItem) {
      throw new Error('Status do cenário não encontrado');
    }

    return CatalogItemVO.create({
      id: prismaItem.id.toString(),
      tenantId: prismaItem.tenant_id.toString(),
      categorySlug: prismaItem.categoria.slug,
      slug: prismaItem.slug,
      label: prismaItem.label,
      ordem: prismaItem.ordem ?? undefined,
      ativo: prismaItem.ativo,
      metadata: (prismaItem.metadados as Prisma.JsonObject | null) ?? null,
      produtoId: prismaItem.produto_id ? prismaItem.produto_id.toString() : null,
    });
  }

  private toJsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return value as unknown as Prisma.InputJsonValue;
  }

  private parseAjustes(value: Prisma.JsonValue | null): AjusteCapacidade[] {
    if (!value || (value as any) === Prisma.JsonNull) {
      return [];
    }

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (typeof item !== 'object' || item === null) {
          return null;
        }

        const record = item as Record<string, unknown>;
        const squadId = typeof record.squadId === 'string' ? record.squadId : undefined;
        const delta =
          typeof record.deltaPercentual === 'number' ? record.deltaPercentual : undefined;

        if (!squadId || delta === undefined) {
          return null;
        }

        return {
          squadId,
          deltaPercentual: delta,
        } satisfies AjusteCapacidade;
      })
      .filter((item): item is AjusteCapacidade => item !== null);
  }

  private parseResultado(value: Prisma.JsonValue | null): ResultadoCenario | undefined {
    if (!value || (value as any) === Prisma.JsonNull) {
      return undefined;
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const cabem = Array.isArray(record.cabemEpicos)
      ? (record.cabemEpicos as unknown[]).filter((v): v is string => typeof v === 'string')
      : [];
    const atrasados = Array.isArray(record.atrasadosEpicos)
      ? (record.atrasadosEpicos as unknown[]).filter((v): v is string => typeof v === 'string')
      : [];
    const comentarios = Array.isArray(record.comentarios)
      ? (record.comentarios as unknown[]).filter((v): v is string => typeof v === 'string')
      : undefined;

    if (cabem.length === 0 && atrasados.length === 0 && !comentarios) {
      return undefined;
    }

    return {
      cabemEpicos: cabem,
      atrasadosEpicos: atrasados,
      comentarios,
    } satisfies ResultadoCenario;
  }
}
