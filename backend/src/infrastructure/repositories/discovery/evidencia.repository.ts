import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Evidencia } from '../../../domain/discovery/entities';
import { IEvidenciaRepository, EvidenciaFilters } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  EvidenciaId,
  DiscoveryId,
  HipoteseId,
  TipoEvidenciaVO,
  TipoEvidenciaEnum,
} from '../../../domain/discovery/value-objects';
import { Prisma } from '@prisma/client';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '../../../domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '../../../domain/catalog/catalog.constants';

@Injectable()
export class EvidenciaPrismaRepository implements IEvidenciaRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async findById(tenantId: TenantId, id: EvidenciaId): Promise<Evidencia | null> {
    const evidencia = await this.prisma.evidencia.findFirst({
      where: {
        id: BigInt(id.getValue()),
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      include: this.includeRelations(),
    });

    if (!evidencia) {
      return null;
    }

    return this.toDomain(evidencia);
  }

  async findByIds(tenantId: TenantId, ids: string[]): Promise<Evidencia[]> {
    const evidencias = await this.prisma.evidencia.findMany({
      where: {
        id: {
          in: ids.map((id) => BigInt(id)),
        },
        id_tenant: BigInt(tenantId.getValue()),
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return evidencias.map((e) => this.toDomain(e));
  }

  async findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Evidencia[]> {
    const evidencias = await this.prisma.evidencia.findMany({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return evidencias.map((e) => this.toDomain(e));
  }

  async findByHipotese(tenantId: TenantId, hipoteseId: HipoteseId): Promise<Evidencia[]> {
    const evidencias = await this.prisma.evidencia.findMany({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_hipotese: BigInt(hipoteseId.getValue()),
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return evidencias.map((e) => this.toDomain(e));
  }

  async findAll(tenantId: TenantId, filters?: EvidenciaFilters): Promise<Evidencia[]> {
    const where: Prisma.EvidenciaWhereInput = {
      id_tenant: BigInt(tenantId.getValue()),
      deleted_at: null,
    };

    if (filters?.discoveryId) {
      where.id_discovery = BigInt(filters.discoveryId);
    }

    if (filters?.hipoteseId) {
      where.id_hipotese = BigInt(filters.hipoteseId);
    }

    if (filters?.tipo && filters.tipo.length > 0) {
      where.tipo = {
        is: {
          slug: { in: filters.tipo.map(normalizeValue) },
        },
      };
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const evidencias = await this.prisma.evidencia.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: this.includeRelations(),
    });

    return evidencias.map((e) => this.toDomain(e));
  }

  async save(evidencia: Evidencia): Promise<Evidencia> {
    const data = await this.toPersistence(evidencia);

    const created = await this.prisma.evidencia.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(created);
  }

  async update(evidencia: Evidencia): Promise<Evidencia> {
    if (!evidencia.id) {
      throw new Error('Evidência ID é obrigatório para atualização');
    }

    const data = await this.toPersistence(evidencia);

    const updated = await this.prisma.evidencia.update({
      where: { id: BigInt(evidencia.id.getValue()) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: this.includeRelations(),
    });

    return this.toDomain(updated);
  }

  async delete(tenantId: TenantId, id: EvidenciaId): Promise<void> {
    await this.prisma.evidencia.update({
      where: { id: BigInt(id.getValue()) },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async countByTipo(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
    tipo: TipoEvidenciaEnum,
  ): Promise<number> {
    return this.prisma.evidencia.count({
      where: {
        id_tenant: BigInt(tenantId.getValue()),
        id_discovery: BigInt(discoveryId.getValue()),
        tipo: {
          is: {
            slug: normalizeValue(tipo),
          },
        },
        deleted_at: null,
      },
    });
  }

  private toDomain(data: any): Evidencia {
    return Evidencia.fromPersistence({
      id: data.id ? new EvidenciaId(data.id.toString()) : undefined,
      tenantId: new TenantId(data.id_tenant.toString()),
      discoveryId: new DiscoveryId(data.id_discovery.toString()),
      hipoteseId: data.id_hipotese ? new HipoteseId(data.id_hipotese.toString()) : undefined,
      tipo: new TipoEvidenciaVO(slugToTipoEvidencia(data.tipo?.slug ?? '')),
      titulo: data.titulo,
      descricao: data.descricao,
      arquivoUrl: data.arquivo_url,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    });
  }

  private async toPersistence(evidencia: Evidencia): Promise<any> {
    const tenantId = evidencia.tenantId.getValue();

    const tipoItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.TIPO_EVIDENCIA,
      slug: normalizeValue(evidencia.tipo.getValue()),
    });

    return {
      id_tenant: BigInt(tenantId),
      id_discovery: BigInt(evidencia.discoveryId.getValue()),
      id_hipotese: evidencia.hipoteseId ? BigInt(evidencia.hipoteseId.getValue()) : null,
      tipo_id: BigInt(tipoItem.id),
      titulo: evidencia.titulo,
      descricao: evidencia.descricao,
      arquivo_url: evidencia.arquivoUrl,
      tags: evidencia.tags,
      deleted_at: evidencia.deletedAt ?? null,
    };
  }

  private includeRelations() {
    return {
      tipo: true,
    } as const;
  }
}

const normalizeValue = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

const slugToTipoEvidencia = (slug: string): TipoEvidenciaEnum => {
  const value = slug.toUpperCase() as TipoEvidenciaEnum;
  if (!Object.values(TipoEvidenciaEnum).includes(value)) {
    throw new Error(`Slug de tipo de evidência inválido: ${slug}`);
  }
  return value;
};
