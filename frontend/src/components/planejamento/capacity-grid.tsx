'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PlanejamentoCapacity } from '@/lib/planejamento-api'

interface CapacityGridProps {
  items?: PlanejamentoCapacity[]
}

export function CapacityGrid({ items }: CapacityGridProps) {
  if (!items || items.length === 0) {
    return (
      <Card variant="ghost" className="p-6 text-center text-text-secondary">
        Nenhum snapshot de capacidade cadastrado.
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => {
        const utilization =
          item.capacidadeTotal > 0
            ? Math.round((item.capacidadeUsada / item.capacidadeTotal) * 100)
            : 0
        return (
          <Card key={item.squadId} variant="outline" className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Squad</p>
                <h4 className="text-lg font-semibold text-text-primary">{item.squadId}</h4>
              </div>
              <div className="text-right text-sm text-text-muted">
                <p>Quarter {item.quarter}</p>
                <p>Buffer {item.bufferPercentual}%</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Utilização</span>
                <span>{utilization}%</span>
              </div>
              <Progress value={utilization} className="h-2" />
              <div className="text-xs text-text-secondary">
                {item.capacidadeUsada} / {item.capacidadeTotal} pts alocados
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
