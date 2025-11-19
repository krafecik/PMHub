'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCatalogCategory,
  createCatalogItem,
  deleteCatalogCategory,
  deleteCatalogItem,
  getCatalogCategory,
  listCatalogCategories,
  listCatalogItems,
  updateCatalogCategory,
  updateCatalogItem,
} from '@/lib/catalogos-api'
import { useToast } from '@/hooks/use-toast'

export const catalogQueryKeys = {
  all: ['catalogos'] as const,
  categorias: () => [...catalogQueryKeys.all, 'categorias'] as const,
  categoria: (id: string | undefined) => [...catalogQueryKeys.categorias(), id ?? ''] as const,
  itens: (categoriaId: string | undefined) =>
    [...catalogQueryKeys.categoria(categoriaId), 'itens'] as const,
}

type ListCategoriasParams = Parameters<typeof listCatalogCategories>[0]
type ListItensParams = Parameters<typeof listCatalogItems>[1]
type GetCategoriaParams = Parameters<typeof getCatalogCategory>[1]
type UseCatalogItemsOptions = {
  includeInativos?: boolean
  includeDeleted?: boolean
  enabled?: boolean
}

export function useListCatalogCategories(params?: ListCategoriasParams) {
  return useQuery({
    queryKey: [...catalogQueryKeys.categorias(), params],
    queryFn: () => listCatalogCategories(params),
    staleTime: 60_000,
  })
}

export function useCatalogCategory(
  categoriaId?: string,
  params?: GetCategoriaParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...catalogQueryKeys.categoria(categoriaId), params],
    queryFn: () => {
      if (!categoriaId) throw new Error('Categoria não informada')
      return getCatalogCategory(categoriaId, params)
    },
    enabled: Boolean(categoriaId) && (options?.enabled ?? true),
  })
}

export function useListCatalogItems(
  categoriaId?: string,
  params?: ListItensParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...catalogQueryKeys.itens(categoriaId), params],
    queryFn: () => {
      if (!categoriaId) throw new Error('Categoria não informada')
      return listCatalogItems(categoriaId, params)
    },
    enabled: Boolean(categoriaId) && (options?.enabled ?? true),
  })
}

type CategoriaPayload = Parameters<typeof createCatalogCategory>[0]
type CategoriaUpdatePayload = Parameters<typeof updateCatalogCategory>[1]

export function useCatalogItemsBySlug(slug?: string, options?: UseCatalogItemsOptions) {
  return useQuery({
    queryKey: [
      ...catalogQueryKeys.categorias(),
      'slug',
      slug,
      options?.includeInativos ?? true,
      options?.includeDeleted ?? false,
    ],
    queryFn: async () => {
      if (!slug) {
        throw new Error('Slug de catálogo não informado.')
      }

      const response = await listCatalogCategories({
        slug,
        includeItens: true,
        includeItensInativos: options?.includeInativos ?? true,
        includeItensDeleted: options?.includeDeleted ?? false,
      })

      return response.data[0] ?? null
    },
    enabled: Boolean(slug) && (options?.enabled ?? true),
  })
}

export function useCreateCatalogCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: CategoriaPayload) => createCatalogCategory(payload),
    onSuccess: (categoria) => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categorias() })
      toast({
        title: 'Categoria criada com sucesso',
        description: `Categoria "${categoria.nome}" disponível para uso.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar categoria',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível criar a categoria. Tente novamente.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateCatalogCategory(categoriaId?: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: CategoriaUpdatePayload) => {
      if (!categoriaId) {
        throw new Error('Categoria não informada para atualização.')
      }
      return updateCatalogCategory(categoriaId, payload)
    },
    onSuccess: (categoria) => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categorias() })
      if (categoriaId) {
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categoria(categoriaId) })
      }
      toast({
        title: 'Categoria atualizada',
        description: `Categoria "${categoria.nome}" foi atualizada.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar a categoria. Tente novamente.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteCatalogCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (categoriaId: string) => deleteCatalogCategory(categoriaId),
    onSuccess: (_, categoriaId) => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categorias() })
      queryClient.removeQueries({ queryKey: catalogQueryKeys.categoria(categoriaId) })
      toast({
        title: 'Categoria removida',
        description: 'A categoria foi arquivada e seus itens desativados.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover categoria',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível remover a categoria. Tente novamente.',
        variant: 'destructive',
      })
    },
  })
}

type ItemCreatePayload = Parameters<typeof createCatalogItem>[1]
type ItemUpdatePayload = Parameters<typeof updateCatalogItem>[1]

export function useCreateCatalogItem(categoriaId?: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: ItemCreatePayload) => {
      if (!categoriaId) {
        throw new Error('Selecione uma categoria antes de criar itens.')
      }
      return createCatalogItem(categoriaId, payload)
    },
    onSuccess: (item) => {
      if (categoriaId) {
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.itens(categoriaId) })
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categoria(categoriaId) })
      }
      toast({
        title: 'Item criado com sucesso',
        description: `Item "${item.label}" disponível na categoria.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar item',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível criar o item. Tente novamente.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateCatalogItem(itemId: string, categoriaId?: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: ItemUpdatePayload) => updateCatalogItem(itemId, payload),
    onSuccess: (item) => {
      if (categoriaId) {
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.itens(categoriaId) })
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categoria(categoriaId) })
      }
      toast({
        title: 'Item atualizado',
        description: `Item "${item.label}" foi atualizado.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar item',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar o item. Tente novamente.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteCatalogItem(categoriaId?: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (itemId: string) => deleteCatalogItem(itemId),
    onSuccess: () => {
      if (categoriaId) {
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.itens(categoriaId) })
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.categoria(categoriaId) })
      }
      toast({
        title: 'Item removido',
        description: 'O item foi arquivado e ficará indisponível nas telas.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover item',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível remover o item. Tente novamente.',
        variant: 'destructive',
      })
    },
  })
}
