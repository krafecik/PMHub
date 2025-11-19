'use client'

import * as React from 'react'
import { Clock, Lightbulb, Bug, Rocket, Calendar, Edit, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DemandaListItem } from '@/lib/demandas-api'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'

interface DemandasTableViewProps {
  demandas: DemandaListItem[]
  onSelect: (demandaId: string) => void
  onEdit?: (demandaId: string) => void
  onSelectionChange?: (selectedIds: string[]) => void
}

const tipoIcons = {
  IDEIA: Lightbulb,
  PROBLEMA: Bug,
  OPORTUNIDADE: Rocket,
} as const

const tipoColors = {
  IDEIA: 'warning',
  PROBLEMA: 'error',
  OPORTUNIDADE: 'accent',
} as const

const statusColors = {
  NOVO: 'success',
  TRIAGEM: 'warning',
  ARQUIVADO: 'secondary',
} as const

const prioridadeColors = {
  BAIXA: 'text-gray-600',
  MEDIA: 'text-yellow-600',
  ALTA: 'text-orange-600',
  CRITICA: 'text-red-600',
} as const

export function DemandasTableView({
  demandas,
  onSelect,
  onEdit,
  onSelectionChange,
}: DemandasTableViewProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  // Resetar seleção quando as demandas mudarem
  const demandaIds = React.useMemo(() => demandas.map((d) => d.id).join(','), [demandas])
  React.useEffect(() => {
    setSelectedIds(new Set())
    onSelectionChange?.([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandaIds])

  const handleSelectAll = (checked: boolean) => {
    const newSet = checked ? new Set<string>(demandas.map((d) => d.id)) : new Set<string>()
    setSelectedIds(newSet)
    onSelectionChange?.(Array.from(newSet))
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
    onSelectionChange?.(Array.from(newSet))
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
            <TableHead className="w-[120px]">Tipo</TableHead>
            <TableHead className="w-[150px]">Produto</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[120px]">Origem</TableHead>
            <TableHead className="w-[100px]">Criado</TableHead>
            {onEdit && <TableHead className="w-[120px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandas.map((demanda) => {
            const TipoIcon = tipoIcons[demanda.tipo as keyof typeof tipoIcons] || Clock

            return (
              <TableRow
                key={demanda.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                  selectedIds.has(demanda.id) && 'bg-primary-50 dark:bg-primary-900/10',
                )}
                onClick={() => onSelect(demanda.id)}
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
                    {demanda.comentariosCount !== undefined && demanda.comentariosCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {demanda.comentariosCount} comentário
                        {demanda.comentariosCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      (tipoColors[demanda.tipo as keyof typeof tipoColors] as any) || 'secondary'
                    }
                    className="gap-1"
                  >
                    <TipoIcon className="h-3 w-3" />
                    {demanda.tipoLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{demanda.produtoNome}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      (statusColors[demanda.status as keyof typeof statusColors] as any) ||
                      'secondary'
                    }
                  >
                    {demanda.statusLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      prioridadeColors[demanda.prioridade as keyof typeof prioridadeColors],
                    )}
                  >
                    {demanda.prioridadeLabel}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{demanda.origemLabel}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatRelativeDate(demanda.createdAt)}
                  </div>
                </TableCell>
                {onEdit && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSelect(demanda.id)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(demanda.id)}
                        title="Editar demanda"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
