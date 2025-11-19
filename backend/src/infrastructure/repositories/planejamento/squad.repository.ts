import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { Squad, SquadStatusVO } from '@domain/planejamento';
import { IPlanejamentoSquadRepository } from './squad.repository.interface';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlanejamentoSquadRepository implements IPlanejamentoSquadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(squad: Squad): Promise<string> {
    const obj = squad.toObject();
    const data = {
      id_tenant: BigInt(obj.tenantId),
      produto_id: obj.produtoId ? BigInt(obj.produtoId) : undefined,
      nome: obj.nome,
      slug: obj.slug,
      descricao: obj.descricao ?? undefined,
      status_id: BigInt(obj.status.id),
      cor_token: obj.corToken ?? undefined,
      timezone: obj.timezone ?? 'America/Sao_Paulo',
      capacidade_padrao: obj.capacidadePadrao ?? undefined,
    };

    if (obj.id) {
      await this.prisma.planejamentoSquad.update({
        where: { id: BigInt(obj.id) },
        data,
      });
      return obj.id;
    }

    const created = await this.prisma.planejamentoSquad.create({ data });
    return created.id.toString();
  }

  async findById(id: string, tenantId: string): Promise<Squad | null> {
    const record = await this.prisma.planejamentoSquad.findFirst({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
        deleted_at: null,
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

  async listByTenant(tenantId: string): Promise<Squad[]> {
    const rows = await this.prisma.planejamentoSquad.findMany({
      where: {
        id_tenant: BigInt(tenantId),
        deleted_at: null,
      },
      include: {
        status: {
          include: {
            categoria: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.planejamentoSquad.updateMany({
      where: {
        id: BigInt(id),
        id_tenant: BigInt(tenantId),
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  private toDomain(record: any): Squad {
    const statusItem = this.mapCatalogItem(record.status);
    return Squad.restore({
      id: record.id.toString(),
      tenantId: record.id_tenant.toString(),
      produtoId: record.produto_id?.toString(),
      nome: record.nome,
      slug: record.slug,
      descricao: record.descricao ?? undefined,
      status: SquadStatusVO.fromCatalogItem(statusItem),
      corToken: record.cor_token ?? undefined,
      timezone: record.timezone ?? undefined,
      capacidadePadrao: record.capacidade_padrao ?? undefined,
      createdAt: record.created_at ?? undefined,
      updatedAt: record.updated_at ?? undefined,
      deletedAt: record.deleted_at ?? undefined,
    });
  }

  private mapCatalogItem(prismaItem: any): CatalogItemVO {
    if (!prismaItem) {
      throw new Error('Estado do squad não encontrado');
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
}
