'use client'

import { useMemo, useState } from 'react'
import { Search, Filter, Plus, TrendingUp, FlaskConical, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatsHeader } from '@/components/ui/stats-header'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { FadeIn } from '@/components/motion/fade-in'
import { ScaleIn } from '@/components/motion/scale-in'
import { HelpButton } from '@/components/ui/help-button'
import { CriarDiscoveryModal } from '@/components/discovery/criar-discovery-modal'
import { DiscoveryCard } from '@/components/discovery/discovery-card'
import { useListarDiscoveries, useEstatisticasDiscovery } from '@/hooks/use-discovery'
import {
  StatusDiscovery,
  ListarDiscoveriesParams,
  STATUS_DISCOVERY_DEFAULTS,
} from '@/lib/discovery-api'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import type { CatalogItem } from '@/lib/catalogos-api'

const STATUS_DISCOVERY_LABELS: Record<string, string> = {
  EM_PESQUISA: 'Em Pesquisa',
  VALIDANDO: 'Validando',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

const fallbackStatusOptions = STATUS_DISCOVERY_DEFAULTS.map((value) => ({
  value,
  label: STATUS_DISCOVERY_LABELS[value] ?? value,
}))

const buildStatusOptions = (items?: CatalogItem[]) => {
  if (!items || items.length === 0) {
    return fallbackStatusOptions
  }

  return items
    .filter((item) => item.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((item) => ({
      value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
      label: item.label,
    }))
}

export default function DiscoveryPage() {
  const [showCriarModal, setShowCriarModal] = useState(false)

  const [filters, setFilters] = useState<ListarDiscoveriesParams>({
    page: 1,
    pageSize: 12,
    searchTerm: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data: discoveries, isLoading } = useListarDiscoveries(filters)
  const { data: stats } = useEstatisticasDiscovery()
  const statusCatalog = useCatalogItemsBySlug('status_discovery', {
    includeInativos: false,
  })
  const statusOptions = useMemo(
    () => buildStatusOptions(statusCatalog.data?.itens as CatalogItem[] | undefined),
    [statusCatalog.data?.itens],
  )

  const handleFilterChange = (key: keyof ListarDiscoveriesParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const statsItems = stats
    ? [
        {
          label: 'Em Pesquisa',
          value: stats.discoveriesEmPesquisa || 0,
          icon: <FlaskConical className="h-4 w-4" />,
          color: 'primary' as const,
        },
        {
          label: 'Validando',
          value: stats.discoveriesValidando || 0,
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'warning' as const,
        },
        {
          label: 'Fechados',
          value: stats.discoveriesFechados || 0,
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'success' as const,
        },
        {
          label: 'Taxa de Validação',
          value: `${Math.round(stats.taxaValidacaoHipoteses || 0)}%`,
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'accent' as const,
        },
      ]
    : []

  const filteredDiscoveries = discoveries?.items || []
  const isLoadingDiscoveries = isLoading && !discoveries

  return (
    <div className="flex flex-col space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Discovery</h1>
            <p className="mt-1 text-muted-foreground">
              Transforme problemas em conhecimento e decisões estratégicas
            </p>
          </div>
          <div className="flex gap-2">
            <HelpButton
              title="Product Discovery"
              content={
                <div className="space-y-4">
                  <p>
                    O módulo de Product Discovery é onde você transforma problemas em conhecimento
                    validado e decisões estratégicas baseadas em dados.
                  </p>
                  <div>
                    <h4 className="mb-2 font-semibold">Conceitos principais:</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      <li>
                        <strong>Discovery:</strong> Investigação estruturada de um problema
                      </li>
                      <li>
                        <strong>Hipóteses:</strong> Suposições a serem validadas ou refutadas
                      </li>
                      <li>
                        <strong>Pesquisas:</strong> Métodos de coleta de dados (entrevistas,
                        surveys, etc.)
                      </li>
                      <li>
                        <strong>Evidências:</strong> Fatos e dados que suportam ou refutam hipóteses
                      </li>
                      <li>
                        <strong>Insights:</strong> Interpretações e aprendizados das evidências
                      </li>
                      <li>
                        <strong>Experimentos:</strong> MVPs e testes para validação prática
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold">Como usar:</h4>
                    <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                      <li>Crie um Discovery a partir de uma demanda triada</li>
                      <li>Defina hipóteses sobre o problema</li>
                      <li>Execute pesquisas para coletar evidências</li>
                      <li>Gere insights a partir das evidências</li>
                      <li>Valide hipóteses com experimentos</li>
                      <li>Tome uma decisão final baseada nos aprendizados</li>
                    </ol>
                  </div>
                </div>
              }
            />
            <Button onClick={() => setShowCriarModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Discovery
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Estatísticas */}
      <StatsHeader stats={statsItems} />

      {/* Filtros e Busca */}
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, problema ou tags..."
                  className="pl-9"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.status?.[0] || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange(
                      'status',
                      value === 'all' ? undefined : [value as StatusDiscovery],
                    )
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-') as [
                      ListarDiscoveriesParams['sortBy'],
                      'asc' | 'desc',
                    ]
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder)
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Mais recentes</SelectItem>
                    <SelectItem value="createdAt-asc">Mais antigos</SelectItem>
                    <SelectItem value="updatedAt-desc">Última atualização</SelectItem>
                    <SelectItem value="titulo-asc">Título A-Z</SelectItem>
                    <SelectItem value="titulo-desc">Título Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Lista de Discoveries */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingDiscoveries ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredDiscoveries.length > 0 ? (
            filteredDiscoveries.map((discovery: any, index: number) => (
              <ScaleIn key={discovery.id} delay={index * 0.05}>
                <DiscoveryCard discovery={discovery} />
              </ScaleIn>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhum discovery encontrado</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Comece criando um novo discovery para investigar um problema
                  </p>
                  <Button className="mt-4" onClick={() => setShowCriarModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Discovery
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modal de Criação */}
      <CriarDiscoveryModal
        open={showCriarModal}
        onOpenChange={setShowCriarModal}
        onSuccess={() => {
          // Query invalidation já é feito pelo hook
        }}
      />
    </div>
  )
}
