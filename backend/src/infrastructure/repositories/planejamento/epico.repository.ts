import { Injectable } from '@nestjs/common';
import { Prisma, PlanejamentoEpicoStatus, PlanejamentoEpicoHealth } from '@prisma/client';
import { PrismaService } from '@infra/database';
import { Epico, EpicoStatusVO, EpicoHealthVO, QuarterVO } from '@domain/planejamento';
import {
  IPlanejamentoEpicoRepository,
  PlanejamentoEpicoFiltro,
} from './epico.repository.interface';

@Injectable()
export class PlanejamentoEpicoRepository implements IPlanejamentoEpicoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(epico: Epico): Promise<string> {
    const data = this.toPersistence(epico);

    if (epico.id) {
      await this.prisma.planejamentoEpico.update({
        where: { id: BigInt(epico.id) },
        data,
      });
      return epico.id;
    }

    const created = await this.prisma.planejamentoEpico.create({
      data,
    });

    return created.id.toString();
  }

  async findById(id: string, tenantId: string): Promise<Epico | null> {
    const record = await this.prisma.planejamentoEpico.findFirst({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async list(filter: PlanejamentoEpicoFiltro): Promise<{ data: Epico[]; total: number }> {
    const where: Prisma.PlanejamentoEpicoWhereInput = {
      id_tenant: BigInt(filter.tenantId),
      deleted_at: null,
    };

    if (filter.produtoId) {
      where.produto_id = BigInt(filter.produtoId);
    }

    if (filter.quarter) {
      where.quarter = filter.quarter;
    }

    if (filter.squadId) {
      where.squad_id = BigInt(filter.squadId);
    }

    if (filter.status && filter.status.length > 0) {
      where.status = { in: filter.status as PlanejamentoEpicoStatus[] };
    }

    if (filter.search) {
      where.OR = [
        { titulo: { contains: filter.search, mode: 'insensitive' } },
        { descricao: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const take = filter.pageSize ?? 20;
    const skip = ((filter.page ?? 1) - 1) * take;

    const [rows, total] = await Promise.all([
      this.prisma.planejamentoEpico.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.planejamentoEpico.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.planejamentoEpico.updateMany({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  private toPersistence(epico: Epico): Prisma.PlanejamentoEpicoUncheckedCreateInput {
    const obj = epico.toObject();
    return {
      id: obj.id ? BigInt(obj.id) : undefined,
      id_tenant: BigInt(obj.tenantId),
      produto_id: BigInt(obj.produtoId),
      planning_cycle_id: obj.planningCycleId ? BigInt(obj.planningCycleId) : undefined,
      squad_id: obj.squadId ? BigInt(obj.squadId) : undefined,
      owner_id: BigInt(obj.ownerId),
      sponsor_id: obj.sponsorId ? BigInt(obj.sponsorId) : undefined,
      titulo: obj.titulo,
      descricao: obj.descricao,
      objetivo: obj.objetivo,
      value_proposition: obj.valueProposition,
      criterios_aceite: obj.criteriosAceite,
      riscos: obj.riscos,
      status: obj.status.getValue() as PlanejamentoEpicoStatus,
      health: obj.health.getValue() as PlanejamentoEpicoHealth,
      quarter: obj.quarter.getValue(),
      progress_percent: obj.progressPercent ?? 0,
      data_inicio: obj.startDate ?? undefined,
      data_fim: obj.endDate ?? undefined,
      created_at: obj.createdAt ?? undefined,
      updated_at: new Date(),
      deleted_at: obj.deletedAt ?? undefined,
    };
  }

  private toDomain(record: any): Epico {
    return Epico.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      produtoId: record.produto_id.toString(),
      planningCycleId: record.planning_cycle_id?.toString(),
      squadId: record.squad_id?.toString(),
      ownerId: record.owner_id.toString(),
      sponsorId: record.sponsor_id?.toString(),
      titulo: record.titulo,
      descricao: record.descricao ?? undefined,
      objetivo: record.objetivo ?? undefined,
      valueProposition: record.value_proposition ?? undefined,
      criteriosAceite: record.criterios_aceite ?? undefined,
      riscos: record.riscos ?? undefined,
      status: EpicoStatusVO.fromEnum(record.status),
      health: EpicoHealthVO.fromEnum(record.health),
      quarter: QuarterVO.create(record.quarter),
      progressPercent: record.progress_percent ?? 0,
      startDate: record.data_inicio ?? undefined,
      endDate: record.data_fim ?? undefined,
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
      deletedAt: record.deleted_at ?? undefined,
    });
  }
}
