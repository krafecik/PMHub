'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HelpButton } from '@/components/ui/help-button'
import { planejamentoHelpContent } from '@/components/planejamento/help-content'
import {
  fetchPlanningDashboard,
  fetchTimeline,
  fetchCenarios,
  recalcularCenario,
} from '@/lib/planejamento-api'
import { PlanningStats } from '@/components/planejamento/planning-stats'
import { EpicsBoard } from '@/components/planejamento/epics-board'
import { CapacityGrid } from '@/components/planejamento/capacity-grid'
import { ScenarioList } from '@/components/planejamento/scenario-list'
import { CommitmentSummary } from '@/components/planejamento/commitment-summary'
import { TimelineBoard } from '@/components/planejamento/timeline-board'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { Command } from 'lucide-react'

const AVAILABLE_QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026']

function getCurrentQuarter(): string {
  const date = new Date()
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `Q${quarter} ${date.getFullYear()}`
}

export default function PlanejamentoPage() {
  const defaultQuarter = useMemo(() => {
    const current = getCurrentQuarter()
    return AVAILABLE_QUARTERS.includes(current) ? current : AVAILABLE_QUARTERS[0]
  }, [])
  const [quarter, setQuarter] = useState(defaultQuarter)
  const queryClient = useQueryClient()

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['planejamento-dashboard', quarter],
    queryFn: () => fetchPlanningDashboard({ quarter }),
  })

  const { data: timeline } = useQuery({
    queryKey: ['planejamento-timeline', quarter],
    queryFn: () => fetchTimeline(quarter),
  })

  const { data: cenarios } = useQuery({
    queryKey: ['planejamento-cenarios', quarter],
    queryFn: () => fetchCenarios(quarter),
  })

  const recalcMutation = useMutation({
    mutationFn: (cenarioId: string) => recalcularCenario(cenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planejamento-cenarios', quarter] })
    },
  })

  const stats = useMemo(() => {
    if (!dashboard) return []
    const capacity = dashboard.capacity
    const epicos = dashboard.epicos.data
    const healthAlerts = epicos.filter((epico) => epico.health === 'RED').length

    const findTier = (slug: string, legacy: string) =>
      dashboard.commitment?.tiers?.find((tier) => {
        const legacyValue = (tier.metadata?.legacyValue as string | undefined)?.toUpperCase()
        return tier.slug === slug || legacyValue === legacy
      })

    const committedTier = findTier('committed', 'COMMITTED')
    const committedCount = committedTier?.itens.length ?? 0

    return [
      {
        label: 'Carga planejada',
        value: `${capacity.allocated}/${capacity.total}`,
        subLabel: 'Story points alocados',
        progress: capacity.utilization,
      },
      {
        label: 'Épicos ativos',
        value: epicos.length,
        subLabel: 'Para o quarter selecionado',
      },
      {
        label: 'Alertas de risco',
        value: healthAlerts,
        subLabel: 'Health vermelho',
        tone: 'amber' as const,
      },
      {
        label: 'Committed',
        value: committedCount,
        subLabel: 'Epicos confirmados',
        tone: 'emerald' as const,
      },
    ]
  }, [dashboard])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Planejamento trimestral</h1>
          <p className="text-text-secondary">
            Centralize épicos, capacidade e commitments em uma única visão.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_QUARTERS.map((qtr) => (
                <SelectItem key={qtr} value={qtr}>
                  {qtr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <HelpButton title="Ajuda - Planejamento" content={planejamentoHelpContent} />
        </div>
      </header>

      {dashboardLoading ? (
        <Card variant="ghost" className="p-12">
          <AnimatedEmptyState
            icon={<AnimatedIllustration type="empty" />}
            title="Carregando planejamento..."
            description="Buscando dados consolidados do quarter selecionado."
          />
        </Card>
      ) : (
        <>
          <PlanningStats stats={stats} />

          {dashboard?.insights && dashboard.insights.length > 0 && (
            <Card variant="outline" className="p-5">
              <h3 className="text-lg font-semibold text-text-primary">Insights automáticos</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                {dashboard.insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </Card>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">Pipeline de épicos</h2>
                <p className="text-sm text-text-secondary">
                  Status consolidado dos épicos priorizados para este quarter.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="gap-2">
                <Command className="h-4 w-4" />
                Nova proposta
              </Button>
            </div>
            <EpicsBoard epicos={dashboard?.epicos.data} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">Capacidade por squad</h2>
                <p className="text-sm text-text-secondary">
                  Ajuste buffers e garanta utilização abaixo de 110%.
                </p>
              </div>
            </div>
            <CapacityGrid items={dashboard?.capacity.squads} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">Roadmap timeline</h2>
                <p className="text-sm text-text-secondary">
                  Visualização contínua do quarter por squad.
                </p>
              </div>
            </div>
            <TimelineBoard timeline={timeline} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">Simulações de cenário</h2>
                <p className="text-sm text-text-secondary">
                  Teste variações de capacidade e confirme o impacto nos épicos.
                </p>
              </div>
            </div>
            <ScenarioList scenarios={cenarios} onRecalculate={(id) => recalcMutation.mutate(id)} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">Commitment</h2>
                <p className="text-sm text-text-secondary">
                  Consolide o que será Committed, Targeted e Aspirational para o quarter.
                </p>
              </div>
            </div>
            <CommitmentSummary commitment={dashboard?.commitment} />
          </section>
        </>
      )}
    </div>
  )
}
