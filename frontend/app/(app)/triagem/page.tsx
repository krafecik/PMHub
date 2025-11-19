'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  AlertCircle,
  Copy,
  Filter,
  Search,
  Grid3X3,
  List,
  Columns,
  Target,
  TrendingUp,
  Timer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsHeader } from '@/components/ui/stats-header'
import { HelpButton } from '@/components/ui/help-button'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { FadeIn, StaggerChildren } from '@/components/motion'
import { AnimatePresence, motion } from 'framer-motion'
import { DemandaTriagemCard } from '@/components/triagem/demanda-triagem-card'
import { ModalDuplicatas } from '@/components/triagem/modal-duplicatas'
import { ModalSolicitarInfo } from '@/components/triagem/modal-solicitar-info'
import { ModalDetalheTriagem } from '@/components/triagem/modal-detalhe-triagem'
import { ListaDensaView } from '@/components/triagem/lista-densa-view'
import { KanbanView } from '@/components/triagem/kanban-view'
import { ModoFoco } from '@/components/triagem/modo-foco'
import { ModalVirarEpico } from '@/components/triagem/modal-virar-epico'
import { ModalReatribuirPm } from '@/components/triagem/modal-reatribuir-pm'
import {
  listarDemandasPendentes,
  obterEstatisticasTriagem,
  triarDemanda,
  triarDemandasEmLote,
  evoluirParaDiscovery,
  type DemandaPendenteTriagem,
  type TriarDemandaPayload,
} from '@/lib/triagem-api'
import { toast } from 'sonner'

// Conteúdo de ajuda
const triagemHelpContent = (
  <div>
    <h3>Como usar a Triagem de Demandas</h3>

    <h4>O que é Triagem?</h4>
    <p>
      A triagem é o processo de análise e qualificação das demandas recebidas. Aqui você avalia
      impacto, urgência e complexidade, além de verificar duplicatas e solicitar informações
      complementares.
    </p>

    <h4>Estados da Triagem</h4>
    <ul>
      <li>
        <strong>Pendente</strong>: Aguardando análise inicial
      </li>
      <li>
        <strong>Aguardando Info</strong>: Solicitação de informações enviada
      </li>
      <li>
        <strong>Retomado</strong>: Informações recebidas, pronto para reanálise
      </li>
      <li>
        <strong>Pronto Discovery</strong>: Aprovado e enviado para Discovery
      </li>
      <li>
        <strong>Duplicado</strong>: Identificado como duplicata
      </li>
      <li>
        <strong>Arquivado</strong>: Descartado na triagem
      </li>
    </ul>

    <h4>Checklist de Triagem</h4>
    <p>Antes de enviar para Discovery, certifique-se de:</p>
    <ul>
      <li>Descrição está clara e completa</li>
      <li>Produto está correto</li>
      <li>Evidências foram fornecidas</li>
      <li>Impacto e urgência definidos</li>
      <li>Não há duplicações</li>
    </ul>

    <h4>Dicas de Produtividade</h4>
    <ul>
      <li>Use o Modo Foco para triagem rápida em sequência</li>
      <li>Configure regras automáticas para casos comuns</li>
      <li>Use atalhos de teclado: J/K para navegar, E para enviar</li>
    </ul>
  </div>
)

type ViewMode = 'cards' | 'lista' | 'kanban'

export default function TriagemPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('lista')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | string[]>>({})
  const [modalDuplicatasOpen, setModalDuplicatasOpen] = useState(false)
  const [modalSolicitarInfoOpen, setModalSolicitarInfoOpen] = useState(false)
  const [modalDetalheOpen, setModalDetalheOpen] = useState(false)
  const [modoFocoOpen, setModoFocoOpen] = useState(false)
  const [demandaSelecionada, setDemandaSelecionada] = useState<{
    id: string
    titulo: string
    reportadoPor?: any
  } | null>(null)
  const [demandaDetalheSelecionada, setDemandaDetalheSelecionada] =
    useState<DemandaPendenteTriagem | null>(null)
  const [virarEpicoData, setVirarEpicoData] = useState<{
    id: string
    titulo: string
    descricao?: string
    produtoId: string
    produtoNome: string
  } | null>(null)
  const [reatribuirModalOpen, setReatribuirModalOpen] = useState(false)
  const [reatribuirContext, setReatribuirContext] = useState<{ id: string; titulo: string } | null>(
    null,
  )

  const queryClient = useQueryClient()

  const getErrorMessage = useCallback((error: unknown) => {
    return error instanceof Error ? error.message : 'Não foi possível completar a ação.'
  }, [])

  const invalidateTriagem = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['triagem'], exact: false })
  }, [queryClient])

  const handleEnviarParaDiscovery = useCallback(
    async (demandaId: string, payload: TriarDemandaPayload) => {
      await triarDemanda(demandaId, payload)
      const response = await evoluirParaDiscovery(demandaId)
      await invalidateTriagem()
      return response
    },
    [invalidateTriagem],
  )

  const handleAtualizarStatus = useCallback(
    async (
      demandaId: string,
      novoStatus: string,
      extras: Partial<Omit<TriarDemandaPayload, 'novoStatus'>> = {},
    ) => {
      await triarDemanda(demandaId, {
        novoStatus,
        ...extras,
      })
      await invalidateTriagem()
    },
    [invalidateTriagem],
  )

  const handleArquivar = useCallback(
    async (demandaId: string) => {
      try {
        await handleAtualizarStatus(demandaId, 'ARQUIVADO_TRIAGEM')
        toast.success('Demanda arquivada com sucesso.')
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    },
    [getErrorMessage, handleAtualizarStatus],
  )

  const openSolicitarInfoModal = useCallback((demanda: DemandaPendenteTriagem) => {
    setDemandaSelecionada({
      id: demanda.id,
      titulo: demanda.titulo,
      reportadoPor: demanda.responsavel
        ? {
            id: demanda.responsavel.id,
            nome: demanda.responsavel.nome,
            email: '',
          }
        : undefined,
    })
    setModalSolicitarInfoOpen(true)
  }, [])

  const openDuplicatasModal = useCallback((demanda: DemandaPendenteTriagem) => {
    setDemandaSelecionada({
      id: demanda.id,
      titulo: demanda.titulo,
    })
    setModalDuplicatasOpen(true)
  }, [])

  const openReatribuirModal = useCallback((demanda: DemandaPendenteTriagem) => {
    setReatribuirContext({
      id: demanda.id,
      titulo: demanda.titulo,
    })
    setReatribuirModalOpen(true)
  }, [])

  const handleTriarEmLote = useCallback(
    async (demandaIds: string[]) => {
      if (demandaIds.length === 0) return
      try {
        await triarDemandasEmLote(demandaIds)
        toast.success('Demandas atualizadas para triagem.')
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        await invalidateTriagem()
      }
    },
    [getErrorMessage, invalidateTriagem],
  )

  const handleArquivarEmLote = useCallback(
    async (demandaIds: string[]) => {
      if (demandaIds.length === 0) return
      try {
        await Promise.all(
          demandaIds.map((id) =>
            triarDemanda(id, {
              novoStatus: 'ARQUIVADO_TRIAGEM',
            }),
          ),
        )
        toast.success('Demandas arquivadas.')
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        await invalidateTriagem()
      }
    },
    [getErrorMessage, invalidateTriagem],
  )

  // Buscar demandas pendentes - movido para cima para evitar erro de referência
  const { data: demandas, isLoading: loadingDemandas } = useQuery({
    queryKey: ['triagem', 'demandas', selectedFilters],
    queryFn: () =>
      listarDemandasPendentes({
        filtros: selectedFilters,
        paginacao: { pageSize: 50 },
      }),
  })

  const handleVirarEpico = useCallback((demanda: DemandaPendenteTriagem) => {
    setVirarEpicoData({
      id: demanda.id,
      titulo: demanda.titulo,
      descricao: demanda.descricao,
      produtoId: demanda.produto.id,
      produtoNome: demanda.produto.nome,
    })
  }, [])

  const closeVirarEpicoModal = useCallback(() => setVirarEpicoData(null), [])

  const handleModoFocoTriar = useCallback(
    async (demandaId: string, payload: TriarDemandaPayload) => {
      try {
        const result = await handleEnviarParaDiscovery(demandaId, payload)
        toast.success('Demanda enviada para Discovery', {
          description: result?.discoveryId ? `Discovery ${result.discoveryId}` : undefined,
        })
      } catch (error) {
        toast.error(getErrorMessage(error))
        throw error
      }
    },
    [getErrorMessage, handleEnviarParaDiscovery],
  )

  const handleModoFocoSalvar = useCallback(
    async (demandaId: string, payload: TriarDemandaPayload) => {
      try {
        await triarDemanda(demandaId, payload)
        await invalidateTriagem()
        toast.success('Triagem salva com sucesso')
      } catch (error) {
        toast.error(getErrorMessage(error))
        throw error
      }
    },
    [getErrorMessage, invalidateTriagem],
  )

  const handleKanbanStatusChange = useCallback(
    async (demandaId: string, novoStatus: string) => {
      const demanda = demandas?.data?.find((item) => item.id === demandaId)
      if (!demanda) {
        return
      }

      const extras: Partial<Omit<TriarDemandaPayload, 'novoStatus'>> = {
        impacto: demanda.triagem.impacto,
        urgencia: demanda.triagem.urgencia,
        complexidade: demanda.triagem.complexidade,
      }

      try {
        if (novoStatus === 'PRONTO_DISCOVERY') {
          const result = await handleEnviarParaDiscovery(demandaId, {
            novoStatus,
            ...extras,
          })
          toast.success('Demanda enviada para Discovery', {
            description: result?.discoveryId ? `Discovery ${result.discoveryId}` : undefined,
          })
        } else {
          await handleAtualizarStatus(demandaId, novoStatus, extras)
          toast.success('Status atualizado')
        }
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    },
    [demandas?.data, getErrorMessage, handleAtualizarStatus, handleEnviarParaDiscovery],
  )

  const findDemandaById = useCallback(
    (demandaId: string) => (demandas?.data ?? []).find((item) => item.id === demandaId) ?? null,
    [demandas?.data],
  )

  const statusIsActive = (value: string) => {
    const current = selectedFilters.status
    if (!current) {
      return false
    }
    if (Array.isArray(current)) {
      return current.includes(value)
    }
    return current === value
  }

  const toggleStatusFilter = useCallback((value: string) => {
    setSelectedFilters((prev) => {
      const current = prev.status
      const isActive = Array.isArray(current) ? current.includes(value) : current === value

      if (isActive) {
        const { status: _status, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        status: value,
      }
    })
  }, [])

  // Buscar estatísticas
  const { data: estatisticas, isLoading: loadingStats } = useQuery({
    queryKey: ['triagem', 'estatisticas'],
    queryFn: () => obterEstatisticasTriagem(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })

  // Calcular stats para o header
  const stats = useMemo(() => {
    if (!estatisticas) return []

    return [
      {
        label: 'Pendentes',
        value: estatisticas.totalPendentes.toString(),
        icon: <Clock className="h-4 w-4" />,
        color: 'warning' as const,
      },
      {
        label: 'SLA Médio',
        value: `${estatisticas.slaMedio}h`,
        icon: <Timer className="h-4 w-4" />,
        color: estatisticas.slaMedio < 24 ? ('success' as const) : ('error' as const),
      },
      {
        label: 'Taxa de Aprovação',
        value: `${estatisticas.taxaAprovacao}%`,
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'primary' as const,
      },
      {
        label: 'Duplicatas',
        value: `${estatisticas.taxaDuplicacao}%`,
        icon: <Copy className="h-4 w-4" />,
        color: 'accent' as const,
      },
    ]
  }, [estatisticas])

  // Filtrar demandas localmente
  const filteredDemandas = useMemo(() => {
    if (!demandas?.data || !searchTerm) return demandas?.data || []

    return demandas.data.filter(
      (demanda) =>
        demanda.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demanda.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demanda.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [demandas?.data, searchTerm])

  const handleModoFoco = () => {
    setModoFocoOpen(true)
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Triagem de Demandas</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Analise e qualifique demandas antes de enviá-las ao Discovery
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton title="Ajuda - Triagem" content={triagemHelpContent} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleModoFoco}
              disabled={loadingDemandas || filteredDemandas.length === 0}
            >
              <Target className="mr-2 h-4 w-4" />
              Modo Foco
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!loadingStats && <StatsHeader stats={stats} className="mt-4" />}

        {/* Filters and Search */}
        <Card variant="elevated" className="mt-4">
          <div className="p-4">
            {/* Header com busca e botão de colapsar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  placeholder="Buscar por título, descrição ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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

            {/* Filters and View Mode - Colapsável */}
            <AnimatePresence initial={false}>
              {filtersExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtros
                      </Button>

                      {/* Quick filters */}
                      <Badge
                        variant={statusIsActive('PENDENTE_TRIAGEM') ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleStatusFilter('PENDENTE_TRIAGEM')}
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Pendentes
                      </Badge>
                      <Badge
                        variant={statusIsActive('AGUARDANDO_INFO') ? 'warning' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleStatusFilter('AGUARDANDO_INFO')}
                      >
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Aguardando Info
                      </Badge>
                    </div>

                    {/* View Mode Selector */}
                    <div className="flex items-center gap-1 rounded-lg border p-1">
                      <Button
                        variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode('cards')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'lista' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode('lista')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode('kanban')}
                      >
                        <Columns className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Content */}
        <div className="mt-6">
          {loadingDemandas ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard variant="demanda" count={6} />
            </div>
          ) : filteredDemandas.length > 0 ? (
            <>
              {viewMode === 'cards' && (
                <StaggerChildren className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
                  {filteredDemandas.map((demanda, index) => (
                    <DemandaTriagemCard
                      key={demanda.id}
                      demanda={demanda}
                      index={index}
                      onTriar={() => {
                        setDemandaDetalheSelecionada(demanda)
                        setModalDetalheOpen(true)
                      }}
                      onSolicitarInfo={() => openSolicitarInfoModal(demanda)}
                      onMarcarDuplicata={() => openDuplicatasModal(demanda)}
                      onArquivar={() => {
                        void handleArquivar(demanda.id)
                      }}
                      onVirarEpico={() => handleVirarEpico(demanda)}
                      onReatribuir={() => openReatribuirModal(demanda)}
                    />
                  ))}
                </StaggerChildren>
              )}
              {viewMode === 'lista' && (
                <ListaDensaView
                  demandas={filteredDemandas}
                  onDetalhar={(demanda) => {
                    setDemandaDetalheSelecionada(demanda)
                    setModalDetalheOpen(true)
                  }}
                  onTriar={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) {
                      setDemandaDetalheSelecionada(demanda)
                      setModalDetalheOpen(true)
                    }
                  }}
                  onTriarLote={handleTriarEmLote}
                  onSolicitarInfo={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) openSolicitarInfoModal(demanda)
                  }}
                  onMarcarDuplicata={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) openDuplicatasModal(demanda)
                  }}
                  onArquivar={(demandaId) => {
                    void handleArquivar(demandaId)
                  }}
                  onArquivarLote={handleArquivarEmLote}
                  onReatribuir={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) openReatribuirModal(demanda)
                  }}
                />
              )}
              {viewMode === 'kanban' && (
                <KanbanView
                  demandas={filteredDemandas}
                  onDetalhar={(demanda) => {
                    setDemandaDetalheSelecionada(demanda)
                    setModalDetalheOpen(true)
                  }}
                  onTriar={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) {
                      setDemandaDetalheSelecionada(demanda)
                      setModalDetalheOpen(true)
                    }
                  }}
                  onSolicitarInfo={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) openSolicitarInfoModal(demanda)
                  }}
                  onMarcarDuplicata={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) openDuplicatasModal(demanda)
                  }}
                  onArquivar={(demandaId) => {
                    void handleArquivar(demandaId)
                  }}
                  onReatribuir={(demandaId) => {
                    const demanda = findDemandaById(demandaId)
                    if (demanda) openReatribuirModal(demanda)
                  }}
                  onStatusChange={handleKanbanStatusChange}
                />
              )}
            </>
          ) : (
            <Card variant="elevated" className="p-12">
              <AnimatedEmptyState
                icon={<AnimatedIllustration type="empty" />}
                title="Nenhuma demanda para triagem"
                description={
                  searchTerm || Object.keys(selectedFilters).length > 0
                    ? 'Tente ajustar os filtros ou termos de busca'
                    : 'Todas as demandas foram triadas. Bom trabalho!'
                }
              />
            </Card>
          )}
        </div>
      </FadeIn>

      {/* Modals */}
      {demandaSelecionada && (
        <>
          <ModalDuplicatas
            open={modalDuplicatasOpen}
            onOpenChange={setModalDuplicatasOpen}
            demandaId={demandaSelecionada.id}
            demandaTitulo={demandaSelecionada.titulo}
          />
          <ModalSolicitarInfo
            open={modalSolicitarInfoOpen}
            onOpenChange={setModalSolicitarInfoOpen}
            demandaId={demandaSelecionada.id}
            demandaTitulo={demandaSelecionada.titulo}
            reportadoPor={demandaSelecionada.reportadoPor}
          />
        </>
      )}

      {/* Modal de Detalhe */}
      <ModalDetalheTriagem
        open={modalDetalheOpen}
        onOpenChange={(open) => {
          setModalDetalheOpen(open)
          if (!open) {
            setDemandaDetalheSelecionada(null)
          }
        }}
        demanda={demandaDetalheSelecionada}
        onTriar={handleEnviarParaDiscovery}
        onSolicitarInfo={() => {
          if (demandaDetalheSelecionada) {
            openSolicitarInfoModal(demandaDetalheSelecionada)
            setModalDetalheOpen(false)
          }
        }}
        onMarcarDuplicata={() => {
          if (demandaDetalheSelecionada) {
            openDuplicatasModal(demandaDetalheSelecionada)
            setModalDetalheOpen(false)
          }
        }}
        onArquivar={() => {
          if (demandaDetalheSelecionada) {
            void handleArquivar(demandaDetalheSelecionada.id)
          }
          setModalDetalheOpen(false)
        }}
        onVirarEpico={() => {
          if (demandaDetalheSelecionada) {
            handleVirarEpico(demandaDetalheSelecionada)
          }
        }}
      />

      {/* Modo Foco */}
      <ModoFoco
        open={modoFocoOpen}
        onOpenChange={setModoFocoOpen}
        demandas={filteredDemandas.filter((d) => d.triagem.status === 'PENDENTE_TRIAGEM')}
        onTriar={handleModoFocoTriar}
        onSalvar={handleModoFocoSalvar}
        onSolicitarInfo={(demandaId) => {
          const demanda = findDemandaById(demandaId)
          if (demanda) {
            openSolicitarInfoModal(demanda)
            setModoFocoOpen(false)
          }
        }}
        onMarcarDuplicata={(demandaId) => {
          const demanda = findDemandaById(demandaId)
          if (demanda) {
            openDuplicatasModal(demanda)
            setModoFocoOpen(false)
          }
        }}
        onArquivar={(demandaId) => {
          void handleArquivar(demandaId)
        }}
        onVirarEpico={(demandaId) => {
          const demanda = findDemandaById(demandaId)
          if (demanda) {
            handleVirarEpico(demanda)
            setModoFocoOpen(false)
          }
        }}
      />

      <ModalVirarEpico
        open={!!virarEpicoData}
        onOpenChange={(openValue) => {
          if (!openValue) {
            closeVirarEpicoModal()
          }
        }}
        demanda={virarEpicoData}
        onCompleted={() => {
          closeVirarEpicoModal()
          void invalidateTriagem()
        }}
      />

      <ModalReatribuirPm
        open={reatribuirModalOpen}
        onOpenChange={(openValue) => {
          setReatribuirModalOpen(openValue)
          if (!openValue) {
            setReatribuirContext(null)
          }
        }}
        demandaId={reatribuirContext?.id}
        demandaTitulo={reatribuirContext?.titulo}
        onSuccess={() => {
          void invalidateTriagem()
        }}
      />
    </div>
  )
}
