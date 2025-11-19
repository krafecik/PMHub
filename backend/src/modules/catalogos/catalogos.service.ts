import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { Prisma, TenantRole } from '@prisma/client';
import { ListCategoriasDto } from './dto/list-categorias.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import { ListItensDto } from './dto/list-itens.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { GetCategoriaDto } from './dto/get-categoria.dto';

export type CatalogCategoryView = {
  id: string;
  tenantId: string;
  slug: string;
  nome: string;
  descricao: string | null;
  escopoProduto: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  itensCount?: number;
  itens?: CatalogItemView[];
};

export type CatalogItemView = {
  id: string;
  tenantId: string;
  categoryId: string;
  categoriaSlug: string;
  slug: string;
  label: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  metadata: Record<string, unknown> | null;
  produtoId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_ITEMS_PAGE_SIZE = 100;

@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(
    tenantId: string,
    filters: ListCategoriasDto,
  ): Promise<PaginatedResult<CatalogCategoryView>> {
    const page = filters.page ?? DEFAULT_PAGE;
    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

    const where: Prisma.CatalogCategoryWhereInput = {
      tenant_id: BigInt(tenantId),
      deleted_at: filters.includeDeleted ? undefined : null,
    };

    if (filters.slug) {
      where.slug = filters.slug;
    }

    if (filters.context) {
      where.slug = { startsWith: filters.context };
    }

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderByField = filters.orderBy ?? 'nome';
    const orderDirection = filters.orderDirection ?? 'asc';

    const [total, categorias] = await this.prisma.$transaction([
      this.prisma.catalogCategory.count({ where }),
      this.prisma.catalogCategory.findMany({
        where,
        orderBy: { [orderByField]: orderDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: filters.includeItens
          ? {
              itens: {
                where: {
                  deleted_at: filters.includeItensDeleted ? undefined : null,
                  ativo: filters.includeItensInativos ? undefined : true,
                },
                orderBy: [{ ordem: 'asc' }, { label: 'asc' }],
              },
            }
          : undefined,
      }),
    ]);

    const data = categorias.map((categoria) => {
      const view = this.toCategoryView(categoria);

      if (filters.includeItens) {
        const categoriaComItens = categoria as Prisma.CatalogCategoryGetPayload<{
          include: { itens: true };
        }>;

        if (categoriaComItens.itens) {
          view.itens = categoriaComItens.itens.map(
            (item: (typeof categoriaComItens.itens)[number]) =>
              this.toItemView(item, categoria.slug),
          );
          view.itensCount = categoriaComItens.itens.length;
        } else {
          view.itensCount = 0;
        }
      } else {
        view.itensCount = undefined;
      }

      return view;
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getCategoryById(
    tenantId: string,
    categoriaId: string,
    query: GetCategoriaDto,
  ): Promise<CatalogCategoryView> {
    const where: Prisma.CatalogCategoryWhereUniqueInput = {
      id: BigInt(categoriaId),
    };

    const categoria = await this.prisma.catalogCategory.findFirst({
      where: {
        ...where,
        tenant_id: BigInt(tenantId),
        deleted_at: query.includeDeleted ? undefined : null,
      },
      include: query.includeItens
        ? {
            itens: {
              where: {
                deleted_at: query.includeItensDeleted ? undefined : null,
                ativo: query.includeItensInativos ? undefined : true,
              },
              orderBy: [{ ordem: 'asc' }, { label: 'asc' }],
            },
          }
        : undefined,
    });

    if (!categoria) {
      throw new NotFoundException('Categoria de catálogo não encontrada.');
    }

    const view = this.toCategoryView(categoria);
    if (query.includeItens) {
      const categoriaComItens = categoria as Prisma.CatalogCategoryGetPayload<{
        include: { itens: true };
      }>;

      if (categoriaComItens.itens) {
        view.itens = categoriaComItens.itens.map((item: (typeof categoriaComItens.itens)[number]) =>
          this.toItemView(item, categoria.slug),
        );
        view.itensCount = categoriaComItens.itens.length;
      } else {
        view.itensCount = 0;
      }
    }

    return view;
  }

  async createCategory(
    tenantId: string,
    dto: CreateCategoriaDto,
    user: JwtAccessPayload,
  ): Promise<CatalogCategoryView> {
    this.ensureCanWrite(user, tenantId);

    const slug = this.normalizeSlug(dto.slug ?? dto.nome);
    if (!slug) {
      throw new BadRequestException('Slug da categoria inválido.');
    }

    try {
      const categoria = await this.prisma.catalogCategory.create({
        data: {
          tenant_id: BigInt(tenantId),
          slug,
          nome: dto.nome.trim(),
          descricao: dto.descricao?.trim() ?? null,
          escopo_produto: dto.escopoProduto ?? false,
        },
      });

      return this.toCategoryView(categoria);
    } catch (error) {
      this.handlePrismaError(error, 'Já existe uma categoria de catálogo com este slug.');
      throw error;
    }
  }

  async updateCategory(
    tenantId: string,
    categoriaId: string,
    dto: UpdateCategoriaDto,
    user: JwtAccessPayload,
  ): Promise<CatalogCategoryView> {
    this.ensureCanWrite(user, tenantId);
    const categoria = await this.ensureCategoryExists(tenantId, categoriaId);

    try {
      const updated = await this.prisma.catalogCategory.update({
        where: { id: categoria.id },
        data: {
          nome: dto.nome?.trim() ?? categoria.nome,
          descricao:
            dto.descricao !== undefined ? (dto.descricao?.trim() ?? null) : categoria.descricao,
          escopo_produto:
            dto.escopoProduto !== undefined ? dto.escopoProduto : categoria.escopo_produto,
        },
      });

      return this.toCategoryView(updated);
    } catch (error) {
      this.handlePrismaError(error, 'Erro ao atualizar categoria de catálogo.');
      throw error;
    }
  }

  async deleteCategory(
    tenantId: string,
    categoriaId: string,
    user: JwtAccessPayload,
  ): Promise<void> {
    this.ensureCanWrite(user, tenantId, [TenantRole.CPO]);
    await this.ensureCategoryExists(tenantId, categoriaId);

    await this.prisma.$transaction([
      this.prisma.catalogItem.updateMany({
        where: {
          tenant_id: BigInt(tenantId),
          category_id: BigInt(categoriaId),
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
          ativo: false,
        },
      }),
      this.prisma.catalogCategory.update({
        where: { id: BigInt(categoriaId) },
        data: {
          deleted_at: new Date(),
        },
      }),
    ]);
  }

  async listItems(
    tenantId: string,
    categoriaId: string,
    filters: ListItensDto,
  ): Promise<PaginatedResult<CatalogItemView>> {
    const categoria = await this.ensureCategoryExists(tenantId, categoriaId);

    const page = filters.page ?? DEFAULT_PAGE;
    const pageSize = filters.pageSize ?? DEFAULT_ITEMS_PAGE_SIZE;

    const where: Prisma.CatalogItemWhereInput = {
      tenant_id: BigInt(tenantId),
      category_id: categoria.id,
      deleted_at: filters.includeDeleted ? undefined : null,
    };

    if (!filters.includeInativos) {
      where.ativo = true;
    }

    if (filters.produtoId) {
      this.ensureProductScope(categoria, filters.produtoId);
      where.produto_id = BigInt(filters.produtoId);
    }

    if (filters.search) {
      where.OR = [
        { label: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [total, itens] = await this.prisma.$transaction([
      this.prisma.catalogItem.count({ where }),
      this.prisma.catalogItem.findMany({
        where,
        orderBy: [{ ordem: 'asc' }, { label: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: itens.map((item) => this.toItemView(item, categoria.slug)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createItem(
    tenantId: string,
    categoriaId: string,
    dto: CreateItemDto,
    user: JwtAccessPayload,
  ): Promise<CatalogItemView> {
    this.ensureCanWrite(user, tenantId);
    const categoria = await this.ensureCategoryExists(tenantId, categoriaId);

    const slug = this.normalizeSlug(dto.slug ?? dto.label);
    if (!slug) {
      throw new BadRequestException('Slug do item de catálogo inválido.');
    }

    if (dto.produtoId) {
      this.ensureProductScope(categoria, dto.produtoId);
    }

    const ordem =
      dto.ordem ??
      (
        await this.prisma.catalogItem.aggregate({
          where: {
            tenant_id: BigInt(tenantId),
            category_id: categoria.id,
            produto_id: dto.produtoId ? BigInt(dto.produtoId) : undefined,
          },
          _max: { ordem: true },
        })
      )._max.ordem ??
      0;

    const nextOrder = dto.ordem ?? ordem + 1;

    try {
      const item = await this.prisma.catalogItem.create({
        data: {
          tenant_id: BigInt(tenantId),
          category_id: categoria.id,
          slug,
          label: dto.label.trim(),
          descricao: dto.descricao?.trim() ?? null,
          ordem: nextOrder,
          ativo: dto.ativo ?? true,
          produto_id: dto.produtoId ? BigInt(dto.produtoId) : null,
          metadados: this.normalizeMetadata(dto.metadata ?? null),
        },
      });

      return this.toItemView(item, categoria.slug);
    } catch (error) {
      this.handlePrismaError(error, 'Já existe um item de catálogo com este slug nesta categoria.');
      throw error;
    }
  }

  async updateItem(
    tenantId: string,
    itemId: string,
    dto: UpdateItemDto,
    user: JwtAccessPayload,
  ): Promise<CatalogItemView> {
    this.ensureCanWrite(user, tenantId);
    const item = await this.ensureItemExists(tenantId, itemId);
    const categoria = await this.ensureCategoryExists(tenantId, item.category_id.toString());

    let slug = item.slug;
    if (dto.slug) {
      const normalized = this.normalizeSlug(dto.slug);
      if (!normalized) {
        throw new BadRequestException('Slug do item de catálogo inválido.');
      }
      slug = normalized;
    }

    if (dto.produtoId !== undefined) {
      if (dto.produtoId === null) {
        if (categoria.escopo_produto) {
          // allow null to reset
        }
      } else {
        this.ensureProductScope(categoria, dto.produtoId);
      }
    }

    try {
      const updated = await this.prisma.catalogItem.update({
        where: { id: item.id },
        data: {
          slug,
          label: dto.label?.trim() ?? item.label,
          descricao: dto.descricao !== undefined ? (dto.descricao?.trim() ?? null) : item.descricao,
          ordem: dto.ordem ?? item.ordem,
          ativo: dto.ativo ?? item.ativo,
          produto_id:
            dto.produtoId !== undefined
              ? dto.produtoId
                ? BigInt(dto.produtoId)
                : null
              : item.produto_id,
          metadados:
            dto.metadata !== undefined
              ? this.normalizeMetadata(dto.metadata)
              : (item.metadados ?? Prisma.JsonNull),
        },
      });

      return this.toItemView(updated, categoria.slug);
    } catch (error) {
      this.handlePrismaError(error, 'Já existe um item de catálogo com este slug nesta categoria.');
      throw error;
    }
  }

  async deleteItem(tenantId: string, itemId: string, user: JwtAccessPayload): Promise<void> {
    this.ensureCanWrite(user, tenantId, [TenantRole.CPO, TenantRole.PM]);
    await this.ensureItemExists(tenantId, itemId);

    await this.prisma.catalogItem.update({
      where: { id: BigInt(itemId) },
      data: {
        deleted_at: new Date(),
        ativo: false,
      },
    });
  }

  private toCategoryView(category: {
    id: bigint;
    tenant_id: bigint;
    slug: string;
    nome: string;
    descricao: string | null;
    escopo_produto: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }): CatalogCategoryView {
    return {
      id: category.id.toString(),
      tenantId: category.tenant_id.toString(),
      slug: category.slug,
      nome: category.nome,
      descricao: category.descricao,
      escopoProduto: category.escopo_produto,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      deletedAt: category.deleted_at,
    };
  }

  private toItemView(
    item: {
      id: bigint;
      tenant_id: bigint;
      category_id: bigint;
      slug: string;
      label: string;
      descricao: string | null;
      ordem: number;
      ativo: boolean;
      metadados: Prisma.JsonValue | null;
      produto_id: bigint | null;
      created_at: Date;
      updated_at: Date;
      deleted_at: Date | null;
    },
    categoriaSlug: string,
  ): CatalogItemView {
    return {
      id: item.id.toString(),
      tenantId: item.tenant_id.toString(),
      categoryId: item.category_id.toString(),
      categoriaSlug,
      slug: item.slug,
      label: item.label,
      descricao: item.descricao,
      ordem: item.ordem,
      ativo: item.ativo,
      metadata: this.parseMetadata(item.metadados),
      produtoId: item.produto_id ? item.produto_id.toString() : null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      deletedAt: item.deleted_at,
    };
  }

  private normalizeMetadata(
    metadata: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (metadata === null) {
      return Prisma.JsonNull;
    }
    return metadata as Prisma.InputJsonValue;
  }

  private parseMetadata(metadata: Prisma.JsonValue | null): Record<string, unknown> | null {
    if (metadata === null || (metadata as any) === Prisma.JsonNull) {
      return null;
    }
    if (typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }
    return { value: metadata as unknown };
  }

  private async ensureCategoryExists(tenantId: string, categoriaId: string) {
    const categoria = await this.prisma.catalogCategory.findFirst({
      where: {
        id: BigInt(categoriaId),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria de catálogo não encontrada.');
    }

    return categoria;
  }

  private async ensureItemExists(tenantId: string, itemId: string) {
    const item = await this.prisma.catalogItem.findFirst({
      where: {
        id: BigInt(itemId),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!item) {
      throw new NotFoundException('Item de catálogo não encontrado.');
    }

    return item;
  }

  private ensureProductScope(
    categoria: {
      escopo_produto: boolean;
    },
    produtoId: string,
  ) {
    if (!categoria.escopo_produto && produtoId) {
      throw new BadRequestException('Esta categoria não permite associação por produto.');
    }
  }

  private ensureCanWrite(
    user: JwtAccessPayload,
    tenantId: string,
    roles: TenantRole[] = [TenantRole.CPO, TenantRole.PM],
  ) {
    const tenantAccess = user.tenants.find((tenant) => tenant.tenantId === tenantId);

    if (!tenantAccess || !roles.includes(tenantAccess.role as TenantRole)) {
      throw new ForbiddenException('Permissão insuficiente para alterar catálogos deste tenant.');
    }
  }

  private normalizeSlug(value?: string | null): string {
    if (!value) {
      return '';
    }
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private handlePrismaError(error: unknown, conflictMessage: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(conflictMessage);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Referência inválida informada para atualização.');
      }
    }
  }
}
