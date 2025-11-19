'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Lightbulb,
  Bug,
  Rocket,
  FileText,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { ModalCriarRapida } from '@/components/demandas/modal-criar-rapida'
import { DemandaDrawer } from '@/components/demandas/demanda-drawer'
import { DemandaCard } from '@/components/demandas/demanda-card'
import { DemandasTableView } from '@/components/demandas/demandas-table-view'
import { StatsHeader } from '@/components/ui/stats-header'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { HelpButton, demandasHelpContent } from '@/components/ui/help-button'
import { listarDemandas } from '@/lib/demandas-api'
import { triarDemandasEmLote } from '@/lib/triagem-api'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FadeIn, StaggerChildren } from '@/components/motion'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { StatusDemanda, TipoDemanda, Prioridade } from '@/lib/enums'

type ViewMode = 'cards' | 'table'

export default function DemandasPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDemandaId, setSelectedDemandaId] = useState<string | null>(null)
  const [drawerEditMode, setDrawerEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<{
    tipo?: string
    status?: string[]
    prioridade?: string
  }>({})
  const [selectedDemandaIds, setSelectedDemandaIds] = useState<string[]>([])
  const [showArquivadas, setShowArquivadas] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['demandas', selectedFilters],
    queryFn: () => {
      // Converter strings para enums antes de passar para a API
      const params = {
        ...selectedFilters,
        tipo: selectedFilters.tipo ? [selectedFilters.tipo as TipoDemanda] : undefined,
        status: selectedFilters.status?.map((s) => s as StatusDemanda),
        prioridade: selectedFilters.prioridade
          ? [selectedFilters.prioridade as Prioridade]
          : undefined,
      }
      return listarDemandas(params)
    },
  })

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!data?.data) return []

    const demandas = data.data
    const total = demandas.length
    const porTipo = {
      ideias: demandas.filter((d) => d.tipo === 'IDEIA').length,
      problemas: demandas.filter((d) => d.tipo === 'PROBLEMA').length,
      oportunidades: demandas.filter((d) => d.tipo === 'OPORTUNIDADE').length,
    }

    return [
      {
        label: 'Total de Demandas',
        value: total,
        icon: <FileText className="h-4 w-4" />,
        color: 'primary' as const,
      },
      {
        label: 'Ideias',
        value: porTipo.ideias,
        icon: <Lightbulb className="h-4 w-4" />,
        color: 'warning' as const,
      },
      {
        label: 'Problemas',
        value: porTipo.problemas,
        icon: <Bug className="h-4 w-4" />,
        color: 'error' as const,
      },
      {
        label: 'Oportunidades',
        value: porTipo.oportunidades,
        icon: <Rocket className="h-4 w-4" />,
        color: 'accent' as const,
      },
    ]
  }, [data])

  // Filtrar demandas localmente pela busca e status arquivado
  const filteredDemandas = useMemo(() => {
    if (!data?.data) return []

    let filtered = data.data

    // Filtrar demandas arquivadas se o checkbox não estiver marcado
    if (!showArquivadas) {
      filtered = filtered.filter(
        (demanda) => demanda.status.toUpperCase() !== StatusDemanda.ARQUIVADO,
      )
    }

    // Filtrar pela busca
    if (searchTerm) {
      filtered = filtered.filter(
        (demanda) =>
          demanda.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          demanda.tipoLabel.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }, [data?.data, searchTerm, showArquivadas])

  const handleCriarDemanda = () => {
    setModalOpen(true)
  }

  const handleSuccess = (demandaId: string) => {
    queryClient.invalidateQueries({ queryKey: ['demandas'] })
    setSelectedDemandaId(demandaId)
    setDrawerOpen(true)
  }

  const handleOpenDemanda = (demandaId: string) => {
    setSelectedDemandaId(demandaId)
    setDrawerEditMode(false)
    setDrawerOpen(true)
  }

  const handleEditDemanda = (demandaId: string) => {
    setSelectedDemandaId(demandaId)
    setDrawerEditMode(true)
    setDrawerOpen(true)
  }

  const toggleFilter = (filterType: 'tipo' | 'status' | 'prioridade', value: string) => {
    setSelectedFilters((prev) => {
      if (filterType === 'status') {
        // Para status, trabalhamos com array
        const currentStatus = prev.status || []
        const hasStatus = currentStatus.includes(value)
        return {
          ...prev,
          status: hasStatus ? currentStatus.filter((s) => s !== value) : [...currentStatus, value],
        }
      }
      // Para outros filtros, continuamos com string única
      return {
        ...prev,
        [filterType]: prev[filterType] === value ? undefined : value,
      }
    })
  }

  // Mutation para triagem em lote
  const { mutate: moverParaTriagemEmLote, isPending: isMovingToTriagem } = useMutation({
    mutationFn: async (demandaIds: string[]) => {
      return triarDemandasEmLote(demandaIds)
    },
    onSuccess: (result) => {
      const { sucesso, falhas } = result
      queryClient.invalidateQueries({ queryKey: ['demandas'] })
      queryClient.invalidateQueries({ queryKey: ['triagem'] })
      setSelectedDemandaIds([])

      if (falhas.length === 0) {
        toast.success(`${sucesso.length} demanda(s) movida(s) para triagem com sucesso!`)
      } else if (sucesso.length > 0) {
        toast.warning(
          `${sucesso.length} demanda(s) movida(s) com sucesso, mas ${falhas.length} falharam.`,
        )
      } else {
        toast.error('Não foi possível mover as demandas para triagem.')
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao mover demandas para triagem.')
    },
  })

  const handleMoverParaTriagemEmLote = () => {
    if (selectedDemandaIds.length === 0) return
    moverParaTriagemEmLote(selectedDemandaIds)
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Demandas</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Todas as ideias, problemas e oportunidades em um só lugar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton title="Ajuda - Central de Demandas" content={demandasHelpContent} />
            <Button
              variant="gradient"
              size="sm"
              onClick={handleCriarDemanda}
              className="hidden sm:inline-flex"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Demanda
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && <StatsHeader stats={stats} className="mt-4" />}

        {/* Filters and Search */}
        <Card variant="elevated" className="mt-4">
          <div className="p-6">
            {/* Header com busca e botão de colapsar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  placeholder="Buscar por título ou tipo..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="h-9 w-9"
                title={filtersExpanded ? 'Colapsar filtros' : 'Expandir filtros'}
              >
                {filtersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick Filters - Colapsável */}
            <AnimatePresence initial={false}>
              {filtersExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="mt-4 space-y-4 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-6">
                    {/* Tipo Filters */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-text-muted">Tipo</p>
                      <div className="flex flex-wrap gap-2">
                        {['IDEIA', 'PROBLEMA', 'OPORTUNIDADE'].map((tipo) => (
                          <Badge
                            key={tipo}
                            variant={selectedFilters.tipo === tipo ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer transition-all',
                              selectedFilters.tipo === tipo &&
                                'ring-2 ring-primary-500 ring-offset-2',
                            )}
                            onClick={() => toggleFilter('tipo', tipo)}
                          >
                            {tipo === 'IDEIA' && <Lightbulb className="mr-1 h-3 w-3" />}
                            {tipo === 'PROBLEMA' && <Bug className="mr-1 h-3 w-3" />}
                            {tipo === 'OPORTUNIDADE' && <Rocket className="mr-1 h-3 w-3" />}
                            {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Status Filters */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-text-muted">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['NOVO', 'TRIAGEM', 'ARQUIVADO'].map((status) => (
                          <Badge
                            key={status}
                            variant={
                              selectedFilters.status?.includes(status) ? 'default' : 'outline'
                            }
                            className={cn(
                              'cursor-pointer transition-all',
                              selectedFilters.status?.includes(status) &&
                                'ring-2 ring-primary-500 ring-offset-2',
                            )}
                            onClick={() => toggleFilter('status', status)}
                          >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Priority Filters */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-text-muted">Prioridade</p>
                      <div className="flex flex-wrap gap-2">
                        {['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map((prioridade) => (
                          <Badge
                            key={prioridade}
                            variant={
                              selectedFilters.prioridade === prioridade ? 'default' : 'outline'
                            }
                            className={cn(
                              'cursor-pointer transition-all',
                              selectedFilters.prioridade === prioridade &&
                                'ring-2 ring-primary-500 ring-offset-2',
                            )}
                            onClick={() => toggleFilter('prioridade', prioridade)}
                          >
                            {prioridade === 'MEDIA'
                              ? 'Média'
                              : prioridade.charAt(0) + prioridade.slice(1).toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mostrar arquivadas */}
                  <div className="flex items-center gap-2 border-t pt-4">
                    <Checkbox
                      id="show-archived"
                      checked={showArquivadas}
                      onCheckedChange={(checked) => setShowArquivadas(checked === true)}
                    />
                    <Label
                      htmlFor="show-archived"
                      className="cursor-pointer text-sm font-medium text-text-secondary"
                    >
                      Mostrar arquivadas
                    </Label>
                  </div>

                  {/* View Mode Selector */}
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    <Button
                      variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode('cards')}
                      title="Visualização em cards"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode('table')}
                      title="Visualização em tabela"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Barra de ações em lote */}
        {selectedDemandaIds.length > 0 && (
          <Card variant="elevated" className="mt-8">
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-medium text-text-primary">
                {selectedDemandaIds.length}{' '}
                {selectedDemandaIds.length === 1 ? 'demanda selecionada' : 'demandas selecionadas'}
              </span>
              <Button
                variant="default"
                onClick={handleMoverParaTriagemEmLote}
                disabled={isMovingToTriagem}
                loading={isMovingToTriagem}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Enviar para Triagem
              </Button>
            </div>
          </Card>
        )}

        {/* Grid de Demandas */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard variant="demanda" count={6} />
            </div>
          ) : filteredDemandas && filteredDemandas.length > 0 ? (
            <>
              {viewMode === 'cards' && (
                <StaggerChildren className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDemandas.map((demanda, index) => (
                    <DemandaCard
                      key={demanda.id}
                      demanda={demanda}
                      onClick={() => handleOpenDemanda(demanda.id)}
                      onEdit={() => handleEditDemanda(demanda.id)}
                      index={index}
                    />
                  ))}
                </StaggerChildren>
              )}
              {viewMode === 'table' && (
                <DemandasTableView
                  demandas={filteredDemandas}
                  onSelect={(demandaId) => handleOpenDemanda(demandaId)}
                  onEdit={(demandaId) => handleEditDemanda(demandaId)}
                  onSelectionChange={setSelectedDemandaIds}
                />
              )}
            </>
          ) : (
            <Card variant="elevated" className="p-12">
              {searchTerm || Object.keys(selectedFilters).length > 0 ? (
                <AnimatedEmptyState
                  icon={<AnimatedIllustration type="search" />}
                  title="Nenhuma demanda encontrada"
                  description="Tente ajustar os filtros ou termos de busca"
                />
              ) : (
                <AnimatedEmptyState
                  icon={<AnimatedIllustration type="empty" />}
                  title="Nenhuma demanda cadastrada"
                  description="Comece criando sua primeira demanda para organizar ideias e problemas"
                  action={
                    <Button variant="gradient" onClick={handleCriarDemanda}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar primeira demanda
                    </Button>
                  }
                />
              )}
            </Card>
          )}
        </div>
      </FadeIn>

      {/* Botão flutuante */}
      <FloatingActionButton onClick={handleCriarDemanda}>
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Modal de criação */}
      <ModalCriarRapida open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleSuccess} />

      {/* Drawer de detalhes */}
      <DemandaDrawer
        demandaId={selectedDemandaId}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) {
            setDrawerEditMode(false)
          }
        }}
        initialEditMode={drawerEditMode}
      />
    </div>
  )
}
