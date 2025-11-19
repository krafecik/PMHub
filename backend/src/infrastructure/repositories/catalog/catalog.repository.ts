import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import {
  CatalogItemQuery,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatalogoRepository implements ICatalogoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findItem(query: CatalogItemQuery): Promise<CatalogItemVO | null> {
    const { tenantId, category, slug, legacyValue, id } = query;

    const where: Prisma.CatalogItemWhereInput = {
      tenant_id: BigInt(tenantId),
      categoria: {
        slug: category,
      },
    };

    if (id) {
      where.id = BigInt(id);
    }

    const orFilters: Prisma.CatalogItemWhereInput[] = [];

    if (slug) {
      orFilters.push({ slug });
    }

    if (legacyValue) {
      orFilters.push({
        metadados: {
          path: ['legacyValue'],
          equals: legacyValue,
        },
      });
    }

    if (orFilters.length > 0) {
      where.AND = [{ OR: orFilters }];
    }

    const item = await this.prisma.catalogItem.findFirst({
      where,
      include: {
        categoria: true,
      },
    });

    if (!item) {
      return null;
    }

    return CatalogItemVO.create({
      id: item.id.toString(),
      tenantId: item.tenant_id.toString(),
      categorySlug: item.categoria.slug,
      slug: item.slug,
      label: item.label,
      ordem: item.ordem,
      ativo: item.ativo,
      metadata: (item.metadados as Prisma.JsonObject | null) ?? null,
      produtoId: item.produto_id ? item.produto_id.toString() : null,
    });
  }

  async getRequiredItem(query: CatalogItemQuery): Promise<CatalogItemVO> {
    const item = await this.findItem(query);
    if (!item) {
      throw new Error(
        `Item de catálogo não encontrado: categoria=${query.category}, slug=${query.slug ?? query.legacyValue ?? query.id}`,
      );
    }
    return item;
  }

  async findItemsByIds(tenantId: string, ids: string[]): Promise<CatalogItemVO[]> {
    if (ids.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(ids.map((id) => id.toString())));

    const items = await this.prisma.catalogItem.findMany({
      where: {
        tenant_id: BigInt(tenantId),
        id: {
          in: uniqueIds.map((id) => BigInt(id)),
        },
      },
      include: {
        categoria: true,
      },
    });

    return items.map((item) =>
      CatalogItemVO.create({
        id: item.id.toString(),
        tenantId: item.tenant_id.toString(),
        categorySlug: item.categoria.slug,
        slug: item.slug,
        label: item.label,
        ordem: item.ordem,
        ativo: item.ativo,
        metadata: (item.metadados as Prisma.JsonObject | null) ?? null,
        produtoId: item.produto_id ? item.produto_id.toString() : null,
      }),
    );
  }

  async listItemsByCategory(tenantId: string, categorySlug: string): Promise<CatalogItemVO[]> {
    const items = await this.prisma.catalogItem.findMany({
      where: {
        tenant_id: BigInt(tenantId),
        categoria: {
          slug: categorySlug,
        },
        ativo: true,
      },
      include: {
        categoria: true,
      },
      orderBy: [{ ordem: 'asc' }, { label: 'asc' }],
    });

    return items.map((item) =>
      CatalogItemVO.create({
        id: item.id.toString(),
        tenantId: item.tenant_id.toString(),
        categorySlug: item.categoria.slug,
        slug: item.slug,
        label: item.label,
        ordem: item.ordem,
        ativo: item.ativo,
        metadata: (item.metadados as Prisma.JsonObject | null) ?? null,
        produtoId: item.produto_id ? item.produto_id.toString() : null,
      }),
    );
  }
}
