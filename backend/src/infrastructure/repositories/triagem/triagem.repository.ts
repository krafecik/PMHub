import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma.service';
import { TriagemRepository } from './triagem.repository.interface';
import {
  TriagemDemanda,
  StatusTriagem,
  Impacto,
  Urgencia,
  Complexidade,
  ChecklistItem,
} from '@domain/triagem';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaTriagemRepository implements TriagemRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async findById(id: string): Promise<TriagemDemanda | null> {
    const data = await this.prisma.triagemDemanda.findUnique({
      where: { id: BigInt(id) },
      include: this.includeRelations(),
    });

    return data ? this.toDomainEntity(data) : null;
  }

  async findByDemandaId(demandaId: string, tenantId?: string): Promise<TriagemDemanda | null> {
    const where: any = {
      demanda_id: BigInt(demandaId),
    };

    if (tenantId) {
      where.demanda = {
        tenant_id: BigInt(tenantId),
      };
    }

    const data = await this.prisma.triagemDemanda.findFirst({
      where,
      include: this.includeRelations(),
    });

    return data ? this.toDomainEntity(data) : null;
  }

  async findManyByDemandaIds(demandaIds: string[]): Promise<TriagemDemanda[]> {
    if (demandaIds.length === 0) {
      return [];
    }

    const data = await this.prisma.triagemDemanda.findMany({
      where: {
        demanda_id: {
          in: demandaIds.map((id) => BigInt(id)),
        },
      },
      include: this.includeRelations(),
    });

    return data.map((item) => this.toDomainEntity(item));
  }

  async findByTenantAndPeriodo(
    tenantId: string,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<TriagemDemanda[]> {
    const where: any = {
      demanda: {
        tenant_id: BigInt(tenantId),
      },
    };

    if (dataInicio || dataFim) {
      where.created_at = {};
      if (dataInicio) where.created_at.gte = dataInicio;
      if (dataFim) where.created_at.lte = dataFim;
    }

    const data = await this.prisma.triagemDemanda.findMany({
      where,
      include: this.includeRelations(),
    });

    return data.map((item: any) => this.toDomainEntity(item));
  }

  async create(triagem: TriagemDemanda): Promise<TriagemDemanda> {
    const tenantId = await this.getTenantIdByDemandaId(triagem.demandaId);

    const data = await this.prisma.triagemDemanda.create({
      data: await this.toPersistence(triagem, tenantId),
      include: this.includeRelations(),
    });

    return this.toDomainEntity(data);
  }

  async update(triagem: TriagemDemanda): Promise<void> {
    if (!triagem.id) {
      throw new Error('Triagem sem ID não pode ser atualizada');
    }

    const tenantId = await this.getTenantIdByDemandaId(triagem.demandaId);

    await this.prisma.triagemDemanda.update({
      where: { id: BigInt(triagem.id) },
      data: await this.toPersistence(triagem, tenantId),
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.triagemDemanda.delete({
      where: { id: BigInt(id) },
    });
  }

  private toDomainEntity(data: any): TriagemDemanda {
    const checklistJson = data.checklist_json as Prisma.JsonValue;
    const checklist: ChecklistItem[] = Array.isArray(checklistJson)
      ? (checklistJson as unknown as ChecklistItem[])
      : [];

    const statusSlug = data.status?.slug ?? normalizeValue(data.status_triagem_slug);
    const impactoSlug = data.impacto?.slug ?? normalizeValue(data.impacto_slug);
    const urgenciaSlug = data.urgencia?.slug ?? normalizeValue(data.urgencia_slug);
    const complexidadeSlug = data.complexidade?.slug ?? normalizeValue(data.complexidade_slug);

    return new TriagemDemanda({
      id: data.id?.toString() ?? '',
      demandaId: data.demanda_id.toString(),
      statusTriagem: StatusTriagem.fromString(slugToEnumValue(statusSlug)),
      impacto: impactoSlug ? Impacto.fromString(slugToEnumValue(impactoSlug)) : undefined,
      urgencia: urgenciaSlug ? Urgencia.fromString(slugToEnumValue(urgenciaSlug)) : undefined,
      complexidadeEstimada: complexidadeSlug
        ? Complexidade.fromString(slugToEnumValue(complexidadeSlug))
        : undefined,
      checklist,
      triadoPorId: data.triado_por_id?.toString(),
      triadoEm: data.triado_em ?? undefined,
      revisoesTriagem: data.revisoes_triagem ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  private async toPersistence(triagem: TriagemDemanda, tenantId: string) {
    const statusItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_TRIAGEM,
      slug: normalizeValue(triagem.statusTriagem.value),
    });

    const impactoItem = triagem.impacto
      ? await this.catalogoRepository.getRequiredItem({
          tenantId,
          category: CatalogCategorySlugs.IMPACTO_NIVEL,
          slug: normalizeValue(triagem.impacto.value),
        })
      : null;

    const urgenciaItem = triagem.urgencia
      ? await this.catalogoRepository.getRequiredItem({
          tenantId,
          category: CatalogCategorySlugs.URGENCIA_NIVEL,
          slug: normalizeValue(triagem.urgencia.value),
        })
      : null;

    const complexidadeItem = triagem.complexidadeEstimada
      ? await this.catalogoRepository.getRequiredItem({
          tenantId,
          category: CatalogCategorySlugs.COMPLEXIDADE_NIVEL,
          slug: normalizeValue(triagem.complexidadeEstimada.value),
        })
      : null;

    return {
      demanda_id: BigInt(triagem.demandaId),
      tenant_id: BigInt(tenantId),
      status_triagem_id: BigInt(statusItem.id),
      impacto_id: impactoItem ? BigInt(impactoItem.id) : null,
      urgencia_id: urgenciaItem ? BigInt(urgenciaItem.id) : null,
      complexidade_id: complexidadeItem ? BigInt(complexidadeItem.id) : null,
      checklist_json: triagem.checklist as unknown as Prisma.JsonArray,
      triado_por_id: triagem.triadoPorId ? BigInt(triagem.triadoPorId) : null,
      triado_em: triagem.triadoEm ?? null,
      revisoes_triagem: triagem.revisoesTriagem,
    };
  }

  private includeRelations() {
    return {
      status: true,
      impacto: true,
      urgencia: true,
      complexidade: true,
      demanda: { select: { tenant_id: true } },
    } as const;
  }

  private async getTenantIdByDemandaId(demandaId: string): Promise<string> {
    const demanda = await this.prisma.demanda.findUnique({
      where: { id: BigInt(demandaId) },
      select: { tenant_id: true },
    });

    if (!demanda) {
      throw new Error(`Demanda ${demandaId} não encontrada para obter tenant`);
    }

    return demanda.tenant_id.toString();
  }
}

const normalizeValue = (value?: string): string => {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
};

const slugToEnumValue = (slug?: string): string => {
  if (!slug) {
    throw new Error('Slug inválido para conversão de enum');
  }
  return slug.toUpperCase();
};
