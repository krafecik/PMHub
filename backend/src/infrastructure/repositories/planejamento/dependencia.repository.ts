import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import {
  Dependencia,
  DependenciaRiscoVO,
  DependenciaTipoVO,
  ListarDependenciasFiltro,
} from '@domain/planejamento';
import { IPlanejamentoDependenciaRepository } from './dependencia.repository.interface';
import { PlanejamentoDependenciaRisco, PlanejamentoDependenciaTipo } from '@prisma/client';

@Injectable()
export class PlanejamentoDependenciaRepository implements IPlanejamentoDependenciaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(dependencia: Dependencia): Promise<void> {
    const obj = dependencia.toObject();

    if (obj.id) {
      await this.prisma.planejamentoDependencia.update({
        where: { id: BigInt(obj.id) },
        data: {
          tipo: obj.tipo.getValue() as PlanejamentoDependenciaTipo,
          risco: obj.risco.getValue() as PlanejamentoDependenciaRisco,
          nota: obj.nota,
        },
      });
      return;
    }

    await this.prisma.planejamentoDependencia.create({
      data: {
        id_tenant: BigInt(obj.tenantId),
        feature_bloqueada_id: BigInt(obj.featureBloqueadaId),
        feature_bloqueadora_id: BigInt(obj.featureBloqueadoraId),
        tipo: obj.tipo.getValue() as PlanejamentoDependenciaTipo,
        risco: obj.risco.getValue() as PlanejamentoDependenciaRisco,
        nota: obj.nota,
      },
    });
  }

  async listByFeature(featureId: string, tenantId: string): Promise<Dependencia[]> {
    const rows = await this.prisma.planejamentoDependencia.findMany({
      where: {
        id_tenant: BigInt(tenantId),
        feature_bloqueada_id: BigInt(featureId),
      },
      orderBy: { created_at: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async listAll(filter: ListarDependenciasFiltro): Promise<Dependencia[]> {
    const where: any = {
      id_tenant: BigInt(filter.tenantId),
    };

    if (filter.featureId) {
      where.feature_bloqueada_id = BigInt(filter.featureId);
    }

    if (filter.epicoId) {
      where.feature_bloqueada = {
        epico_id: BigInt(filter.epicoId),
      };
    }

    if (filter.quarter) {
      where.feature_bloqueada = {
        ...where.feature_bloqueada,
        epico: {
          quarter: filter.quarter,
        },
      };
    }

    const rows = await this.prisma.planejamentoDependencia.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async deleteById(id: string, tenantId: string): Promise<void> {
    await this.prisma.planejamentoDependencia.deleteMany({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
      },
    });
  }

  private toDomain(record: any): Dependencia {
    return Dependencia.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      featureBloqueadaId: record.feature_bloqueada_id.toString(),
      featureBloqueadoraId: record.feature_bloqueadora_id.toString(),
      tipo: DependenciaTipoVO.fromEnum(record.tipo),
      risco: DependenciaRiscoVO.fromEnum(record.risco),
      nota: record.nota ?? undefined,
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
    });
  }
}
