'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  Send,
  Info,
  Copy,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DemandaPendenteTriagem } from '@/lib/triagem-api'
import { cn } from '@/lib/utils'
import { useTriagemCatalogOptions, TriagemOption } from '@/hooks/use-triagem-catalogos'

interface ListaDensaViewProps {
  demandas: DemandaPendenteTriagem[]
  onDetalhar: (demanda: DemandaPendenteTriagem) => void
  onTriar: (demandaId: string) => void
  onTriarLote: (demandaIds: string[]) => void
  onSolicitarInfo: (demandaId: string) => void
  onMarcarDuplicata: (demandaId: string) => void
  onArquivar: (demandaId: string) => void
  onArquivarLote: (demandaIds: string[]) => void
  onReatribuir: (demandaId: string) => void
}

const statusIcons = {
  PENDENTE_TRIAGEM: Clock,
  AGUARDANDO_INFO: AlertCircle,
  PRONTO_DISCOVERY: CheckCircle,
} as const

const statusColors = {
  PENDENTE_TRIAGEM: 'warning',
  AGUARDANDO_INFO: 'secondary',
  PRONTO_DISCOVERY: 'success',
} as const

const fallbackImpactoTextClass: Record<string, string> = {
  BAIXO: 'text-gray-600',
  MEDIO: 'text-yellow-600',
  ALTO: 'text-orange-600',
  CRITICO: 'text-red-600',
}

export function ListaDensaView({
  demandas,
  onDetalhar,
  onTriar,
  onTriarLote,
  onSolicitarInfo,
  onMarcarDuplicata,
  onArquivar,
  onArquivarLote,
  onReatribuir,
}: ListaDensaViewProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const triagemCatalogs = useTriagemCatalogOptions()

  const normalizeValue = (value?: string | null) => (value ? value.toString().toUpperCase() : '')

  const getMetadataString = (option: TriagemOption | undefined, key: string) => {
    const metadata = option?.metadata as Record<string, unknown> | undefined
    const value = metadata?.[key]
    return typeof value === 'string' ? value : undefined
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(demandas.map((d) => d.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const isAllSelected = demandas.length > 0 && selectedIds.size === demandas.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < demandas.length

  return (
    <Card variant="elevated" className="overflow-hidden">
      {selectedIds.size > 0 && (
        <div className="border-b bg-primary-50 px-4 py-2 dark:bg-primary-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedIds.size}{' '}
              {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const ids = Array.from(selectedIds)
                  onTriarLote(ids)
                  setSelectedIds(new Set())
                }}
              >
                <Send className="mr-2 h-3 w-3" />
                Triar em lote
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const ids = Array.from(selectedIds)
                  onArquivarLote(ids)
                  setSelectedIds(new Set())
                }}
              >
                <Archive className="mr-2 h-3 w-3" />
                Arquivar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Selecionar todos"
                className={cn(isSomeSelected && 'data-[state=checked]:bg-gray-400')}
              />
            </TableHead>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-[150px]">Produto</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Impacto</TableHead>
            <TableHead className="w-[100px]">Urgência</TableHead>
            <TableHead className="w-[120px]">Checklist</TableHead>
            <TableHead className="w-[100px]">Criado</TableHead>
            <TableHead className="w-[200px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandas.map((demanda, index) => {
            const Icon = statusIcons[demanda.triagem.status as keyof typeof statusIcons] || Clock
            const itensObrigatorios = demanda.triagem.checklist.filter((item) => item.required)
            const itensConcluidos = itensObrigatorios.filter((item) => item.completed)
            const progressoChecklist = {
              concluidos: itensConcluidos.length,
              total: itensObrigatorios.length,
              percentual:
                itensObrigatorios.length > 0
                  ? Math.round((itensConcluidos.length / itensObrigatorios.length) * 100)
                  : 0,
            }

            const impactoOption = triagemCatalogs.impacto.map.get(
              normalizeValue(demanda.triagem.impacto),
            )
            const urgenciaOption = triagemCatalogs.urgencia.map.get(
              normalizeValue(demanda.triagem.urgencia),
            )

            const impactoLabel = impactoOption?.label ?? demanda.triagem.impacto
            const urgenciaLabel = urgenciaOption?.label ?? demanda.triagem.urgencia
            const impactoTextClass =
              getMetadataString(impactoOption, 'textClass') ??
              fallbackImpactoTextClass[normalizeValue(demanda.triagem.impacto)] ??
              'text-gray-600'

            return (
              <TableRow
                key={demanda.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                  selectedIds.has(demanda.id) && 'bg-primary-50 dark:bg-primary-900/10',
                )}
                onClick={() => onDetalhar(demanda)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(demanda.id)}
                    onCheckedChange={(checked) => handleSelectOne(demanda.id, checked as boolean)}
                    aria-label={`Selecionar demanda ${demanda.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">#{demanda.id}</TableCell>
                <TableCell>
                  <div className="max-w-[300px]">
                    <p className="truncate font-medium">{demanda.titulo}</p>
                    {demanda.triagem.possivelDuplicata && (
                      <Badge variant="warning" className="mt-1 text-xs">
                        <Copy className="mr-1 h-2 w-2" />
                        Possível duplicata
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{demanda.produto.nome}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      statusColors[demanda.triagem.status as keyof typeof statusColors] as any
                    }
                    className="gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {demanda.triagem.statusLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  {demanda.triagem.impacto && (
                    <span className={cn('text-sm font-medium', impactoTextClass)}>
                      {impactoLabel}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {demanda.triagem.urgencia && <span className="text-sm">{urgenciaLabel}</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-[60px] flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className={cn(
                          'h-full rounded-full',
                          progressoChecklist.percentual === 100
                            ? 'bg-green-600'
                            : progressoChecklist.percentual >= 50
                              ? 'bg-yellow-600'
                              : 'bg-red-600',
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressoChecklist.percentual}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {progressoChecklist.concluidos}/{progressoChecklist.total}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {demanda.triagem.diasEmTriagem}d
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSolicitarInfo(demanda.id)}
                      title="Solicitar informações"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                    {demanda.triagem.possivelDuplicata && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMarcarDuplicata(demanda.id)}
                        title="Marcar como duplicata"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReatribuir(demanda.id)}
                      title="Reatribuir PM"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onArquivar(demanda.id)}
                      title="Arquivar"
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={() => onTriar(demanda.id)}
                      disabled={progressoChecklist.percentual < 100}
                      title="Enviar para Discovery"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
