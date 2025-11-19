import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Entrevista } from '../../../domain/discovery/entities';
import { IEntrevistaRepository, EntrevistaFilters } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { EntrevistaId, PesquisaId } from '../../../domain/discovery/value-objects';
import { Prisma } from '@prisma/client';

@Injectable()
export class EntrevistaPrismaRepository implements IEntrevistaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: TenantId, id: EntrevistaId): Promise<Entrevista | null> {
    const entrevista = await this.prisma.entrevista.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
    });

    if (!entrevista) {
      return null;
    }

    return this.toDomain(entrevista);
  }

  async findByPesquisa(tenantId: TenantId, pesquisaId: PesquisaId): Promise<Entrevista[]> {
    const entrevistas = await this.prisma.entrevista.findMany({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_pesquisa: BigInt(pesquisaId.getValue()),
        deleted_at: null,
      },
      orderBy: {
        data_hora: 'desc',
      },
    });

    return entrevistas.map((e) => this.toDomain(e));
  }

  async findAll(tenantId: TenantId, filters?: EntrevistaFilters): Promise<Entrevista[]> {
    const where: Prisma.EntrevistaWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
    };

    if (filters?.pesquisaId) {
      where.id_pesquisa = BigInt(filters.pesquisaId);
    }

    if (filters?.dataInicio || filters?.dataFim) {
      where.data_hora = {};
      if (filters.dataInicio) {
        where.data_hora.gte = filters.dataInicio;
      }
      if (filters.dataFim) {
        where.data_hora.lte = filters.dataFim;
      }
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const entrevistas = await this.prisma.entrevista.findMany({
      where,
      orderBy: {
        data_hora: 'desc',
      },
    });

    return entrevistas.map((e) => this.toDomain(e));
  }

  async save(entrevista: Entrevista): Promise<Entrevista> {
    const data = this.toPersistence(entrevista);

    const created = await this.prisma.entrevista.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return this.toDomain(created);
  }

  async update(entrevista: Entrevista): Promise<Entrevista> {
    if (!entrevista.id) {
      throw new Error('Entrevista ID é obrigatório para atualização');
    }

    const data = this.toPersistence(entrevista);

    const updated = await this.prisma.entrevista.update({
      where: { id: BigInt(entrevista.id.getValue()) },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(tenantId: TenantId, id: EntrevistaId): Promise<void> {
    await this.prisma.entrevista.update({
      where: { id: BigInt(id.getValue()) },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async countByPesquisa(tenantId: TenantId, pesquisaId: PesquisaId): Promise<number> {
    return this.prisma.entrevista.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_pesquisa: BigInt(pesquisaId.getValue()),
        deleted_at: null,
      },
    });
  }

  private toDomain(data: any): Entrevista {
    return Entrevista.fromPersistence({
      id: data.id ? new EntrevistaId(data.id.toString()) : undefined,
      tenantId: new TenantId(data.id_tenant.toString()),
      pesquisaId: new PesquisaId(data.id_pesquisa.toString()),
      participanteNome: data.participante_nome,
      participantePerfil: data.participante_perfil,
      participanteEmail: data.participante_email,
      dataHora: data.data_hora,
      transcricao: data.transcricao,
      notas: data.notas,
      gravacaoUrl: data.gravacao_url,
      tags: data.tags || [],
      duracaoMinutos: data.duracao_minutos,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    });
  }

  private toPersistence(entrevista: Entrevista): any {
    return {
      id_tenant: BigInt(entrevista.tenantId.getValue()),
      id_pesquisa: BigInt(entrevista.pesquisaId.getValue()),
      participante_nome: entrevista.participanteNome,
      participante_perfil: entrevista.participantePerfil,
      participante_email: entrevista.participanteEmail,
      data_hora: entrevista.dataHora,
      transcricao: entrevista.transcricao,
      notas: entrevista.notas,
      gravacao_url: entrevista.gravacaoUrl,
      tags: entrevista.tags,
      duracao_minutos: entrevista.duracaoMinutos,
    };
  }
}
