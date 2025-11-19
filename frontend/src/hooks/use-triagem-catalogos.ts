'use client'

import * as React from 'react'
import { useCatalogItemsBySlug } from './use-catalogos'
import type { CatalogItem } from '@/lib/catalogos-api'

export type TriagemOption = {
  value: string
  label: string
  slug: string
  metadata?: Record<string, unknown> | null
  ordem?: number
}

export type TriagemCatalogGroup = {
  options: TriagemOption[]
  map: Map<string, TriagemOption>
  loading: boolean
}

const fallbackImpacto: TriagemOption[] = [
  {
    value: 'BAIXO',
    label: 'Baixo',
    slug: 'baixo',
    metadata: { badgeVariant: 'outline', textClass: 'text-gray-600' },
  },
  {
    value: 'MEDIO',
    label: 'Médio',
    slug: 'medio',
    metadata: { badgeVariant: 'secondary', textClass: 'text-yellow-600' },
  },
  {
    value: 'ALTO',
    label: 'Alto',
    slug: 'alto',
    metadata: { badgeVariant: 'warning', textClass: 'text-orange-600' },
  },
  {
    value: 'CRITICO',
    label: 'Crítico',
    slug: 'critico',
    metadata: { badgeVariant: 'destructive', textClass: 'text-red-600' },
  },
]

const fallbackUrgencia: TriagemOption[] = [
  {
    value: 'BAIXA',
    label: 'Baixa',
    slug: 'baixa',
    metadata: { badgeVariant: 'outline', textClass: 'text-gray-600' },
  },
  {
    value: 'MEDIA',
    label: 'Média',
    slug: 'media',
    metadata: { badgeVariant: 'secondary', textClass: 'text-yellow-600' },
  },
  {
    value: 'ALTA',
    label: 'Alta',
    slug: 'alta',
    metadata: { badgeVariant: 'destructive', textClass: 'text-red-600' },
  },
]

const fallbackComplexidade: TriagemOption[] = [
  {
    value: 'BAIXA',
    label: 'Baixa',
    slug: 'baixa',
    metadata: { badgeVariant: 'outline', textClass: 'text-gray-600' },
  },
  {
    value: 'MEDIA',
    label: 'Média',
    slug: 'media',
    metadata: { badgeVariant: 'secondary', textClass: 'text-yellow-600' },
  },
  {
    value: 'ALTA',
    label: 'Alta',
    slug: 'alta',
    metadata: { badgeVariant: 'warning', textClass: 'text-orange-600' },
  },
]

const normalizeKey = (value: string) => value.toUpperCase()

function buildOptions(
  catalogItems: CatalogItem[] | undefined,
  fallback: TriagemOption[],
): TriagemOption[] {
  if (catalogItems && catalogItems.length > 0) {
    return catalogItems
      .filter((item) => item.ativo)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((item, index) => ({
        value:
          ((item.metadata as Record<string, unknown> | undefined)?.legacyValue as string) ??
          item.slug,
        label: item.label,
        slug: item.slug,
        metadata: item.metadata ?? undefined,
        ordem: item.ordem ?? index,
      }))
  }

  return fallback.map((option, index) => ({
    ...option,
    metadata: option.metadata ?? undefined,
    ordem: option.ordem ?? index,
  }))
}

function buildGroup(
  catalogItems: CatalogItem[] | undefined,
  fallback: TriagemOption[],
  loading: boolean,
): TriagemCatalogGroup {
  const options = buildOptions(catalogItems, fallback)
  const map = new Map<string, TriagemOption>()
  options.forEach((option) => {
    map.set(normalizeKey(option.value), option)
  })
  return { options, map, loading }
}

export function useTriagemCatalogOptions() {
  const impactoQuery = useCatalogItemsBySlug('impacto_nivel', {
    includeInativos: false,
  })
  const urgenciaQuery = useCatalogItemsBySlug('urgencia_nivel', {
    includeInativos: false,
  })
  const complexidadeQuery = useCatalogItemsBySlug('complexidade_nivel', {
    includeInativos: false,
  })

  const impacto = React.useMemo(
    () => buildGroup(impactoQuery.data?.itens, fallbackImpacto, impactoQuery.isLoading),
    [impactoQuery.data, impactoQuery.isLoading],
  )

  const urgencia = React.useMemo(
    () => buildGroup(urgenciaQuery.data?.itens, fallbackUrgencia, urgenciaQuery.isLoading),
    [urgenciaQuery.data, urgenciaQuery.isLoading],
  )

  const complexidade = React.useMemo(
    () =>
      buildGroup(complexidadeQuery.data?.itens, fallbackComplexidade, complexidadeQuery.isLoading),
    [complexidadeQuery.data, complexidadeQuery.isLoading],
  )

  return {
    impacto,
    urgencia,
    complexidade,
    isLoading: impacto.loading || urgencia.loading || complexidade.loading,
  }
}

export function getMetadataString(option: TriagemOption | undefined, key: string) {
  const metadata = option?.metadata as Record<string, unknown> | undefined
  const value = metadata?.[key]
  return typeof value === 'string' ? value : undefined
}

export function getMetadataNumber(option: TriagemOption | undefined, key: string) {
  const metadata = option?.metadata as Record<string, unknown> | undefined
  const value = metadata?.[key]
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}
