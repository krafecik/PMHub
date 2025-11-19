import { Injectable } from '@nestjs/common';
import { Prisma, PlanejamentoFeatureStatus } from '@prisma/client';
import { PrismaService } from '@infra/database';
import { Feature, FeatureStatusVO, ListarFeaturesFiltro } from '@domain/planejamento';
import { IPlanejamentoFeatureRepository } from './feature.repository.interface';

@Injectable()
export class PlanejamentoFeatureRepository implements IPlanejamentoFeatureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(feature: Feature): Promise<string> {
    const data = this.toPersistence(feature);

    if (feature.id) {
      await this.prisma.planejamentoFeature.update({
        where: { id: BigInt(feature.id) },
        data,
      });
      return feature.id;
    }

    const created = await this.prisma.planejamentoFeature.create({ data });
    return created.id.toString();
  }

  async saveMany(features: Feature[]): Promise<void> {
    await this.prisma.$transaction(
      features.map((feature) => {
        const data = this.toPersistence(feature);
        if (feature.id) {
          return this.prisma.planejamentoFeature.update({
            where: { id: BigInt(feature.id) },
            data,
          });
        }
        return this.prisma.planejamentoFeature.create({ data });
      }),
    );
  }

  async findById(id: string, tenantId: string): Promise<Feature | null> {
    const record = await this.prisma.planejamentoFeature.findFirst({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async listByEpico(epicoId: string, tenantId: string): Promise<Feature[]> {
    const records = await this.prisma.planejamentoFeature.findMany({
      where: {
        epico_id: BigInt(epicoId),
        id_tenant: BigInt(tenantId),
        deleted_at: null,
      },
      orderBy: { created_at: 'asc' },
    });

    return records.map((row) => this.toDomain(row));
  }

  async list(filter: ListarFeaturesFiltro): Promise<{ data: Feature[]; total: number }> {
    const where: Prisma.PlanejamentoFeatureWhereInput = {
      id_tenant: BigInt(filter.tenantId),
      deleted_at: null,
    };

    if (filter.epicoId) {
      where.epico_id = BigInt(filter.epicoId);
    }

    if (filter.squadId) {
      where.squad_id = BigInt(filter.squadId);
    }

    if (filter.status && filter.status.length > 0) {
      where.status = { in: filter.status as PlanejamentoFeatureStatus[] };
    }

    if (filter.search) {
      where.OR = [
        { titulo: { contains: filter.search, mode: 'insensitive' } },
        { descricao: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.quarter) {
      where.epico = {
        quarter: filter.quarter,
        deleted_at: null,
      };
    }

    const take = filter.pageSize ?? 20;
    const skip = ((filter.page ?? 1) - 1) * take;

    const [rows, total] = await Promise.all([
      this.prisma.planejamentoFeature.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.planejamentoFeature.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  private toPersistence(feature: Feature): Prisma.PlanejamentoFeatureUncheckedCreateInput {
    const obj = feature.toObject();
    return {
      id: obj.id ? BigInt(obj.id) : undefined,
      id_tenant: BigInt(obj.tenantId),
      epico_id: BigInt(obj.epicoId),
      squad_id: obj.squadId ? BigInt(obj.squadId) : undefined,
      titulo: obj.titulo,
      descricao: obj.descricao,
      pontos: obj.pontos ?? undefined,
      status: obj.status.getValue() as PlanejamentoFeatureStatus,
      riscos: obj.riscos,
      criterios_aceite: obj.criteriosAceite,
      dependencias_json: obj.dependenciasIds ?? undefined,
      revisado_por_id: obj.revisadoPorId ? BigInt(obj.revisadoPorId) : undefined,
      created_at: obj.createdAt ?? undefined,
      updated_at: new Date(),
      deleted_at: obj.deletedAt ?? undefined,
    };
  }

  private toDomain(record: any): Feature {
    return Feature.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      epicoId: record.epico_id.toString(),
      squadId: record.squad_id?.toString(),
      titulo: record.titulo,
      descricao: record.descricao ?? undefined,
      pontos: record.pontos ?? undefined,
      status: FeatureStatusVO.fromEnum(record.status),
      riscos: record.riscos ?? undefined,
      criteriosAceite: record.criterios_aceite ?? undefined,
      dependenciasIds: Array.isArray(record.dependencias_json)
        ? record.dependencias_json.map((item: any) => item.toString?.() ?? String(item))
        : [],
      revisadoPorId: record.revisado_por_id?.toString(),
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
      deletedAt: record.deleted_at ?? undefined,
    });
  }
}
