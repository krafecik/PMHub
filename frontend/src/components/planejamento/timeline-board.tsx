'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface TimelineBoardProps {
  timeline?: Record<
    string,
    {
      squadId?: string
      epicos: Array<{
        id: string
        titulo: string
        status: string
        quarter: string
        progressPercent?: number
      }>
    }
  >
}

const statusColors: Record<string, string> = {
  PLANNED: 'text-slate-500',
  IN_PROGRESS: 'text-blue-500',
  AT_RISK: 'text-amber-500',
  DONE: 'text-emerald-500',
  ON_HOLD: 'text-purple-500',
}

export function TimelineBoard({ timeline }: TimelineBoardProps) {
  if (!timeline || Object.keys(timeline).length === 0) {
    return (
      <Card variant="ghost" className="p-6 text-center text-text-secondary">
        Nenhum dado para o timeline.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {Object.values(timeline).map((group) => (
        <Card key={group.squadId ?? 'unassigned'} variant="outline" className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-text-primary">
              Squad {group.squadId ?? 'Não definido'}
            </h4>
            <span className="text-sm text-text-muted">{group.epicos.length} épicos</span>
          </div>
          <div className="space-y-3">
            {group.epicos.map((epico) => (
              <div key={epico.id}>
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-text-primary">{epico.titulo}</div>
                  <span className={statusColors[epico.status] || 'text-text-secondary'}>
                    {epico.status.replace('_', ' ')}
                  </span>
                </div>
                <Progress value={epico.progressPercent ?? 0} className="mt-2 h-2" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
