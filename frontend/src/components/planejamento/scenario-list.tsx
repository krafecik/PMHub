'use client'

import { PlanejamentoScenario } from '@/lib/planejamento-api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

type BadgeVariant = NonNullable<BadgeProps['variant']>

const allowedVariants: BadgeVariant[] = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'success',
  'warning',
  'info',
]

const readMetadataString = (
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined => {
  if (!metadata) return undefined
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

const resolveScenarioVariant = (
  metadata: Record<string, unknown> | null | undefined,
  slug?: string,
): BadgeVariant => {
  const configured = readMetadataString(metadata, 'badgeVariant')
  if (configured && allowedVariants.includes(configured as BadgeVariant)) {
    return configured as BadgeVariant
  }

  const legacy = readMetadataString(metadata, 'legacyValue')?.toUpperCase()
  if (legacy === 'PUBLISHED') return 'default'
  if (legacy === 'ARCHIVED') return 'secondary'

  if (slug) {
    const normalized = slug.toLowerCase()
    if (normalized === 'published') return 'default'
    if (normalized === 'archived') return 'secondary'
  }

  return 'outline'
}

interface ScenarioListProps {
  scenarios?: PlanejamentoScenario[]
  onRecalculate?: (cenarioId: string) => void
}

export function ScenarioList({ scenarios, onRecalculate }: ScenarioListProps) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <Card variant="ghost" className="p-6 text-center text-text-secondary">
        Nenhum cenário salvo para este quarter.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <Card key={scenario.id} variant="outline" className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-text-primary">{scenario.nome}</h4>
                <Badge
                  variant={resolveScenarioVariant(scenario.statusMetadata, scenario.statusSlug)}
                >
                  {scenario.statusLabel ?? scenario.statusSlug ?? scenario.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{scenario.descricao}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-text-muted">
                Buffer de risco: {scenario.bufferRiscoPercentual}% •{' '}
                {scenario.incluirContractors ? 'Com contractors' : 'Sem contractors'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onRecalculate?.(scenario.id)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Recalcular
              </Button>
            </div>
          </div>

          {scenario.resultado && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Card
                variant="ghost"
                className="border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/20"
              >
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Cabem no quarter
                </p>
                <p className="text-2xl font-semibold text-text-primary">
                  {scenario.resultado.cabemEpicos.length}
                </p>
              </Card>
              <Card
                variant="ghost"
                className="border border-rose-100 bg-rose-50/40 p-4 dark:border-rose-900/30 dark:bg-rose-900/20"
              >
                <p className="text-sm font-medium text-rose-500">Atrasam ou excedem</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {scenario.resultado.atrasadosEpicos.length}
                </p>
              </Card>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
