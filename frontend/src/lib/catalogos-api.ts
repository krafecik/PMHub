'use client'

import { apiFetch } from './api-client'

export type CatalogItem = {
  id: string
  tenantId: string
  categoryId: string
  categoriaSlug: string
  slug: string
  label: string
  descricao: string | null
  ordem: number
  ativo: boolean
  metadata: Record<string, unknown> | null
  produtoId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type CatalogCategory = {
  id: string
  tenantId: string
  slug: string
  nome: string
  descricao: string | null
  escopoProduto: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  itensCount?: number
  itens?: CatalogItem[]
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type ListCategoriasParams = {
  search?: string
  slug?: string
  includeDeleted?: boolean
  includeItens?: boolean
  includeItensDeleted?: boolean
  includeItensInativos?: boolean
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

type GetCategoriaParams = {
  includeItens?: boolean
  includeItensDeleted?: boolean
  includeItensInativos?: boolean
  includeDeleted?: boolean
}

type ListItensParams = {
  search?: string
  produtoId?: string
  includeInativos?: boolean
  includeDeleted?: boolean
  page?: number
  pageSize?: number
}

const buildQueryString = (params?: Record<string, unknown>) => {
  if (!params) return ''

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.append(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function listCatalogCategories(
  params?: ListCategoriasParams,
): Promise<PaginatedResponse<CatalogCategory>> {
  const query = buildQueryString(params)
  return apiFetch<PaginatedResponse<CatalogCategory>>(`/catalogos/categorias${query}`)
}

export async function getCatalogCategory(
  categoriaId: string,
  params?: GetCategoriaParams,
): Promise<CatalogCategory> {
  const query = buildQueryString(params)
  return apiFetch<CatalogCategory>(`/catalogos/categorias/${categoriaId}${query}`)
}

export async function createCatalogCategory(payload: {
  nome: string
  slug?: string
  descricao?: string | null
  escopoProduto?: boolean
}): Promise<CatalogCategory> {
  return apiFetch<CatalogCategory>(`/catalogos/categorias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCatalogCategory(
  categoriaId: string,
  payload: {
    nome?: string
    descricao?: string | null
    escopoProduto?: boolean
  },
): Promise<CatalogCategory> {
  return apiFetch<CatalogCategory>(`/catalogos/categorias/${categoriaId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteCatalogCategory(categoriaId: string): Promise<void> {
  await apiFetch(`/catalogos/categorias/${categoriaId}`, {
    method: 'DELETE',
  })
}

export async function getCatalogItemsBySlug(
  slug: string,
  params?: { includeInativos?: boolean; includeDeleted?: boolean },
): Promise<CatalogItem[]> {
  const query = buildQueryString({
    slug,
    includeItens: true,
    includeItensInativos: params?.includeInativos ?? true,
    includeItensDeleted: params?.includeDeleted ?? false,
    page: 1,
    pageSize: 200,
  })

  const response = await apiFetch<PaginatedResponse<CatalogCategory>>(
    `/catalogos/categorias${query}`,
  )

  const category = response.data.at(0)
  return category?.itens ?? []
}

export async function listCatalogItems(
  categoriaId: string,
  params?: ListItensParams,
): Promise<PaginatedResponse<CatalogItem>> {
  const query = buildQueryString(params)
  return apiFetch<PaginatedResponse<CatalogItem>>(
    `/catalogos/categorias/${categoriaId}/itens${query}`,
  )
}

export async function createCatalogItem(
  categoriaId: string,
  payload: {
    label: string
    slug?: string
    descricao?: string | null
    ordem?: number
    ativo?: boolean
    produtoId?: string
    metadata?: Record<string, unknown>
  },
): Promise<CatalogItem> {
  return apiFetch<CatalogItem>(`/catalogos/categorias/${categoriaId}/itens`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCatalogItem(
  itemId: string,
  payload: {
    label?: string
    slug?: string
    descricao?: string | null
    ordem?: number
    ativo?: boolean
    produtoId?: string | null
    metadata?: Record<string, unknown> | null
  },
): Promise<CatalogItem> {
  return apiFetch<CatalogItem>(`/catalogos/itens/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteCatalogItem(itemId: string): Promise<void> {
  await apiFetch(`/catalogos/itens/${itemId}`, {
    method: 'DELETE',
  })
}
