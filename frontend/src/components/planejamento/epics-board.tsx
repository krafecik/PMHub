'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PlanejamentoEpico } from '@/lib/planejamento-api'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  AT_RISK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  ON_HOLD: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
}

const healthMap: Record<string, string> = {
  GREEN: 'bg-emerald-500/10 text-emerald-500',
  YELLOW: 'bg-amber-500/10 text-amber-500',
  RED: 'bg-rose-500/10 text-rose-500',
}

interface EpicsBoardProps {
  epicos?: PlanejamentoEpico[]
  onSelect?: (epicoId: string) => void
}

export function EpicsBoard({ epicos, onSelect }: EpicsBoardProps) {
  if (!epicos || epicos.length === 0) {
    return (
      <Card variant="ghost" className="p-8 text-center text-text-secondary">
        Nenhum épico planejado para este quarter.
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {epicos.map((epico) => (
        <Card
          key={epico.id}
          variant="elevated"
          className="cursor-pointer transition hover:-translate-y-0.5 hover:border-primary-200"
          onClick={() => onSelect?.(epico.id)}
        >
          <div className="space-y-3 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">{epico.quarter}</p>
                <h3 className="text-lg font-semibold text-text-primary">{epico.titulo}</h3>
              </div>
              <Badge className={cn('text-xs', statusColors[epico.status] || statusColors.PLANNED)}>
                {epico.status.replace('_', ' ')}
              </Badge>
            </div>

            <p className="line-clamp-2 text-sm text-text-secondary">{epico.descricao}</p>

            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="font-medium text-text-primary">
                Squad {epico.squadId ?? 'não definido'}
              </span>
              <span>•</span>
              <Badge className={cn('rounded-full px-2 py-0.5', healthMap[epico.health])}>
                Health {epico.health.toLowerCase()}
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Progresso</span>
                <span>{epico.progressPercent ?? 0}%</span>
              </div>
              <Progress value={epico.progressPercent ?? 0} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
