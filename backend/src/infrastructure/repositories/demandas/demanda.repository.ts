import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import {
  Demanda,
  TituloVO,
  TipoDemandaVO,
  TipoDemanda,
  OrigemDemandaVO,
  OrigemDemanda,
  PrioridadeVO,
  Prioridade,
  StatusDemandaVO,
  StatusDemanda,
} from '@domain/demandas';
import {
  IDemandaRepository,
  DemandaFilters,
  DemandaPaginatedResult,
} from './demanda.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class DemandaRepository implements IDemandaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(demanda: Demanda): Promise<string> {
    const data = this.toPrisma(demanda);
    
    const created = await this.prisma.demanda.create({
      data: {
        tenant_id: BigInt(data.tenant_id),
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo as TipoDemanda,
        produto_id: BigInt(data.produto_id),
        origem: data.origem as OrigemDemanda,
        origem_detalhe: data.origem_detalhe,
        responsavel_id: data.responsavel_id ? BigInt(data.responsavel_id) : null,
        prioridade: data.prioridade as Prioridade,
        status: data.status as StatusDemanda,
        criado_por_id: BigInt(data.criado_por_id),
      },
    });

    return created.id.toString();
  }

  async findById(tenantId: string, id: string): Promise<Demanda | null> {
    const demanda = await this.prisma.demanda.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!demanda) return null;

    return this.toDomain(demanda);
  }

  async findAll(
    tenantId: string,
    filters?: DemandaFilters
  ): Promise<DemandaPaginatedResult> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenant_id: BigInt(tenantId),
      deleted_at: null,
    };

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status as StatusDemanda[] };
    }

    if (filters?.tipo && filters.tipo.length > 0) {
      where.tipo = { in: filters.tipo as TipoDemanda[] };
    }

    if (filters?.produtoId) {
      where.produto_id = BigInt(filters.produtoId);
    }

    if (filters?.responsavelId) {
      where.responsavel_id = BigInt(filters.responsavelId);
    }

    if (filters?.origem && filters.origem.length > 0) {
      where.origem = { in: filters.origem as OrigemDemanda[] };
    }

    if (filters?.prioridade && filters.prioridade.length > 0) {
      where.prioridade = { in: filters.prioridade as Prioridade[] };
    }

    if (filters?.criadoPorId) {
      where.criado_por_id = BigInt(filters.criadoPorId);
    }

    if (filters?.search) {
      where.OR = [
        { titulo: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (filters?.orderBy) {
      orderBy[filters.orderBy] = 
        filters.orderDirection || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [demandas, total] = await Promise.all([
      this.prisma.demanda.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.demanda.count({ where }),
    ]);

    return {
      data: demandas.map((d: any) => this.toDomain(d)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(demanda: Demanda): Promise<void> {
    if (!demanda.id) throw new Error('Demanda sem ID não pode ser atualizada');
    
    const data = this.toPrisma(demanda);
    
    await this.prisma.demanda.update({
      where: { id: BigInt(demanda.id) },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo as TipoDemanda,
        origem: data.origem as OrigemDemanda,
        origem_detalhe: data.origem_detalhe,
        responsavel_id: data.responsavel_id ? BigInt(data.responsavel_id) : null,
        prioridade: data.prioridade as Prioridade,
        status: data.status as StatusDemanda,
        updated_at: new Date(),
        deleted_at: data.deleted_at,
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.demanda.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });
  }

  private toPrisma(demanda: Demanda): any {
    const obj = demanda.toObject();
    return {
      id: obj.id ? BigInt(obj.id) : undefined,
      tenant_id: obj.tenantId,
      titulo: obj.titulo.getValue(),
      descricao: obj.descricao,
      tipo: obj.tipo.getValue(),
      produto_id: obj.produtoId,
      origem: obj.origem.getValue(),
      origem_detalhe: obj.origemDetalhe,
      responsavel_id: obj.responsavelId,
      prioridade: obj.prioridade.getValue(),
      status: obj.status.getValue(),
      criado_por_id: obj.criadoPorId,
      created_at: obj.createdAt,
      updated_at: obj.updatedAt,
      deleted_at: obj.deletedAt,
    };
  }

  private toDomain(prismaData: any): Demanda {
    return Demanda.restore({
      id: prismaData.id.toString(),
      tenantId: prismaData.tenant_id.toString(),
      titulo: TituloVO.create(prismaData.titulo),
      descricao: prismaData.descricao,
      tipo: TipoDemandaVO.fromEnum(prismaData.tipo),
      produtoId: prismaData.produto_id.toString(),
      origem: OrigemDemandaVO.fromEnum(prismaData.origem),
      origemDetalhe: prismaData.origem_detalhe,
      responsavelId: prismaData.responsavel_id?.toString(),
      prioridade: PrioridadeVO.fromEnum(prismaData.prioridade),
      status: StatusDemandaVO.fromEnum(prismaData.status),
      criadoPorId: prismaData.criado_por_id.toString(),
      createdAt: prismaData.created_at,
      updatedAt: prismaData.updated_at,
      deletedAt: prismaData.deleted_at,
    });
  }
}
