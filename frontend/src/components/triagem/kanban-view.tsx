'use client'

import * as React from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Archive,
  Copy,
  MoreVertical,
  Send,
  Info,
  RotateCcw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DemandaPendenteTriagem } from '@/lib/triagem-api'
import { cn } from '@/lib/utils'
import { useTriagemCatalogOptions, TriagemOption } from '@/hooks/use-triagem-catalogos'

interface KanbanViewProps {
  demandas: DemandaPendenteTriagem[]
  onDetalhar: (demanda: DemandaPendenteTriagem) => void
  onTriar: (demandaId: string) => void
  onSolicitarInfo: (demandaId: string) => void
  onMarcarDuplicata: (demandaId: string) => void
  onArquivar: (demandaId: string) => void
  onReatribuir: (demandaId: string) => void
  onStatusChange?: (demandaId: string, novoStatus: string) => void
}

interface KanbanColumn {
  id: string
  title: string
  status: string[]
  icon: React.ComponentType<any>
  color: string
}

const columns: KanbanColumn[] = [
  {
    id: 'pendente',
    title: 'Pendente Triagem',
    status: ['PENDENTE_TRIAGEM'],
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  },
  {
    id: 'aguardando',
    title: 'Aguardando Informações',
    status: ['AGUARDANDO_INFO'],
    icon: AlertCircle,
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  },
  {
    id: 'retomado',
    title: 'Retomado para Triagem',
    status: ['RETOMADO_TRIAGEM'],
    icon: Clock,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 'pronto',
    title: 'Pronto para Discovery',
    status: ['PRONTO_DISCOVERY'],
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  },
]

export function KanbanView({
  demandas,
  onDetalhar,
  onTriar,
  onSolicitarInfo,
  onMarcarDuplicata,
  onArquivar,
  onReatribuir,
  onStatusChange,
}: KanbanViewProps) {
  const triagemCatalogs = useTriagemCatalogOptions()
  const normalizeValue = (value?: string | null) => (value ? value.toString().toUpperCase() : '')
  const getMetadataString = (option: TriagemOption | undefined, key: string) => {
    const metadata = option?.metadata as Record<string, unknown> | undefined
    const value = metadata?.[key]
    return typeof value === 'string' ? value : undefined
  }
  const fallbackImpactoVariants: Record<string, string> = {
    BAIXO: 'outline',
    MEDIO: 'secondary',
    ALTO: 'warning',
    CRITICO: 'destructive',
  }
  const fallbackUrgenciaVariants: Record<string, string> = {
    BAIXA: 'outline',
    MEDIA: 'secondary',
    ALTA: 'destructive',
  }

  // Agrupar demandas por status
  const demandasPorColuna = React.useMemo(() => {
    const grouped: Record<string, DemandaPendenteTriagem[]> = {}

    columns.forEach((col) => {
      grouped[col.id] = demandas.filter((d) => col.status.includes(d.triagem.status))
    })

    return grouped
  }, [demandas])

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onStatusChange) return

    const { source, destination } = result
    if (source.droppableId === destination.droppableId) return

    // Encontrar a demanda movida
    const demandaId = result.draggableId
    const demanda = demandas.find((d) => d.id === demandaId)
    if (!demanda) return

    // Encontrar o novo status baseado na coluna de destino
    const colunaDestino = columns.find((col) => col.id === destination.droppableId)
    if (!colunaDestino) return

    // Chamar callback para atualizar o status
    onStatusChange(demandaId, colunaDestino.status[0])
  }

  // Se não houver função de mudança de status, desabilitar drag
  const isDragDisabled = !onStatusChange

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => {
          const Icon = column.icon
          const demandasColuna = demandasPorColuna[column.id] || []

          return (
            <div key={column.id} className="flex h-full flex-col">
              <div className={cn('rounded-t-lg p-4', column.color)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{column.title}</h3>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800">
                    {demandasColuna.length}
                  </Badge>
                </div>
              </div>

              <Droppable droppableId={column.id} isDropDisabled={isDragDisabled}>
                {(provided, snapshot) => (
                  <ScrollArea
                    className={cn(
                      'flex-1 rounded-b-lg border-x border-b transition-colors',
                      snapshot.isDraggingOver && 'bg-gray-50 dark:bg-gray-800/50',
                    )}
                  >
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[400px] space-y-2 p-2"
                    >
                      <AnimatePresence>
                        {demandasColuna.map((demanda, index) => {
                          const impactoNormalized = normalizeValue(demanda.triagem.impacto)
                          const urgenciaNormalized = normalizeValue(demanda.triagem.urgencia)
                          const impactoOption = triagemCatalogs.impacto.map.get(impactoNormalized)
                          const urgenciaOption =
                            triagemCatalogs.urgencia.map.get(urgenciaNormalized)
                          const impactoLabel = impactoOption?.label ?? demanda.triagem.impacto
                          const urgenciaLabel = urgenciaOption?.label ?? demanda.triagem.urgencia
                          const impactoVariant = (getMetadataString(
                            impactoOption,
                            'badgeVariant',
                          ) ??
                            fallbackImpactoVariants[impactoNormalized] ??
                            'outline') as any
                          const urgenciaVariant = (getMetadataString(
                            urgenciaOption,
                            'badgeVariant',
                          ) ??
                            fallbackUrgenciaVariants[urgenciaNormalized] ??
                            'outline') as any

                          return (
                            <Draggable
                              key={demanda.id}
                              draggableId={demanda.id}
                              index={index}
                              isDragDisabled={isDragDisabled}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={provided.draggableProps.style}
                                >
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <Card
                                      variant="elevated"
                                      className={cn(
                                        'cursor-pointer p-4 transition-all',
                                        'hover:border-primary-200 hover:shadow-lg',
                                        snapshot.isDragging && 'rotate-3 opacity-90 shadow-xl',
                                      )}
                                      onClick={() => onDetalhar(demanda)}
                                    >
                                      {/* Header do card */}
                                      <div className="mb-2 flex items-start justify-between">
                                        <Badge variant="outline" className="text-xs">
                                          #{demanda.id}
                                        </Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                              <MoreVertical className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={() => onSolicitarInfo(demanda.id)}
                                            >
                                              <Info className="mr-2 h-4 w-4" />
                                              Solicitar Info
                                            </DropdownMenuItem>
                                            {demanda.triagem.possivelDuplicata && (
                                              <DropdownMenuItem
                                                onClick={() => onMarcarDuplicata(demanda.id)}
                                              >
                                                <Copy className="mr-2 h-4 w-4" />
                                                Marcar Duplicata
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              onClick={() => onReatribuir(demanda.id)}
                                            >
                                              <RotateCcw className="mr-2 h-4 w-4" />
                                              Reatribuir PM
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => onArquivar(demanda.id)}
                                            >
                                              <Archive className="mr-2 h-4 w-4" />
                                              Arquivar
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>

                                      {/* Título */}
                                      <h4 className="mb-2 line-clamp-2 text-sm font-medium">
                                        {demanda.titulo}
                                      </h4>

                                      {/* Produto */}
                                      <p className="mb-3 text-xs text-muted-foreground">
                                        {demanda.produto.nome}
                                      </p>

                                      {/* Indicadores */}
                                      <div className="space-y-2">
                                        {/* Checklist Progress */}
                                        <div>
                                          <div className="mb-1 flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Checklist</span>
                                            <span className="font-medium">
                                              {
                                                demanda.triagem.checklist.filter(
                                                  (i) => i.completed && i.required,
                                                ).length
                                              }
                                              /
                                              {
                                                demanda.triagem.checklist.filter((i) => i.required)
                                                  .length
                                              }
                                            </span>
                                          </div>
                                          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                              className={cn(
                                                'h-1.5 rounded-full transition-all',
                                                (() => {
                                                  const required = demanda.triagem.checklist.filter(
                                                    (i) => i.required,
                                                  )
                                                  const completed = required.filter(
                                                    (i) => i.completed,
                                                  )
                                                  const percent =
                                                    required.length > 0
                                                      ? (completed.length / required.length) * 100
                                                      : 0
                                                  return percent === 100
                                                    ? 'bg-green-600'
                                                    : percent >= 50
                                                      ? 'bg-yellow-600'
                                                      : 'bg-red-600'
                                                })(),
                                              )}
                                              style={{
                                                width: `${(() => {
                                                  const required = demanda.triagem.checklist.filter(
                                                    (i) => i.required,
                                                  )
                                                  const completed = required.filter(
                                                    (i) => i.completed,
                                                  )
                                                  return required.length > 0
                                                    ? (completed.length / required.length) * 100
                                                    : 0
                                                })()}%`,
                                              }}
                                            />
                                          </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1">
                                          {demanda.triagem.impacto && (
                                            <Badge variant={impactoVariant} className="text-xs">
                                              Impacto: {impactoLabel}
                                            </Badge>
                                          )}
                                          {demanda.triagem.urgencia && (
                                            <Badge variant={urgenciaVariant} className="text-xs">
                                              Urgência: {urgenciaLabel}
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Alertas */}
                                        {demanda.triagem.possivelDuplicata && (
                                          <Badge
                                            variant="warning"
                                            className="w-full justify-center text-xs"
                                          >
                                            <Copy className="mr-1 h-3 w-3" />
                                            Possível duplicata
                                          </Badge>
                                        )}

                                        {/* Tempo em triagem */}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                          <span>Em triagem há</span>
                                          <span className="font-medium">
                                            {demanda.triagem.diasEmTriagem} dias
                                          </span>
                                        </div>
                                      </div>

                                      {/* Ação principal */}
                                      {column.id === 'pronto' ||
                                      (demanda.triagem.checklist
                                        .filter((i) => i.required)
                                        .every((i) => i.completed) &&
                                        demanda.triagem.impacto &&
                                        demanda.triagem.urgencia) ? (
                                        <Button
                                          size="sm"
                                          variant="gradient"
                                          className="mt-3 w-full"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onTriar(demanda.id)
                                          }}
                                        >
                                          <Send className="mr-2 h-3 w-3" />
                                          Enviar Discovery
                                        </Button>
                                      ) : null}
                                    </Card>
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
