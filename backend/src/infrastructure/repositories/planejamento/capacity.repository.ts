import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { CapacitySnapshot, QuarterVO } from '@domain/planejamento';
import { IPlanejamentoCapacityRepository } from './capacity.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlanejamentoCapacityRepository implements IPlanejamentoCapacityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(snapshot: CapacitySnapshot): Promise<void> {
    const obj = snapshot.toObject();
    const ajustesJson =
      obj.ajustesJson !== undefined ? (obj.ajustesJson as Prisma.InputJsonValue) : Prisma.JsonNull;

    const data = {
      id_tenant: BigInt(obj.tenantId),
      squad_id: BigInt(obj.squadId),
      quarter: obj.quarter.getValue(),
      capacidade_total: obj.capacidadeTotal,
      capacidade_usada: obj.capacidadeUsada,
      buffer_percentual: obj.bufferPercentual,
      ajustes_json: ajustesJson,
    };

    if (obj.id) {
      await this.prisma.planejamentoCapacitySnapshot.update({
        where: { id: BigInt(obj.id) },
        data,
      });
      return;
    }

    await this.prisma.planejamentoCapacitySnapshot.upsert({
      where: {
        squad_id_quarter: {
          squad_id: BigInt(obj.squadId),
          quarter: obj.quarter.getValue(),
        },
      },
      update: data,
      create: data,
    });
  }

  async findBySquadAndQuarter(
    tenantId: string,
    squadId: string,
    quarter: string,
  ): Promise<CapacitySnapshot | null> {
    const record = await this.prisma.planejamentoCapacitySnapshot.findFirst({
      where: {
        id_tenant: BigInt(tenantId),
        squad_id: BigInt(squadId),
        quarter,
      },
    });

    return record ? this.toDomain(record) : null;
  }

  async listByQuarter(tenantId: string, quarter: string): Promise<CapacitySnapshot[]> {
    const rows = await this.prisma.planejamentoCapacitySnapshot.findMany({
      where: {
        id_tenant: BigInt(tenantId),
        quarter,
      },
      orderBy: { squad_id: 'asc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(record: any): CapacitySnapshot {
    return CapacitySnapshot.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      squadId: record.squad_id.toString(),
      quarter: QuarterVO.create(record.quarter),
      capacidadeTotal: record.capacidade_total,
      capacidadeUsada: record.capacidade_usada,
      bufferPercentual: record.buffer_percentual,
      ajustesJson: record.ajustes_json ?? undefined,
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
    });
  }
}
