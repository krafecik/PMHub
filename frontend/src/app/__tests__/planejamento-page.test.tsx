import React from 'react'
import { describe, it, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils'
import { PlanningStats, type PlanningStat } from '@/components/planejamento/planning-stats'
import { EpicsBoard } from '@/components/planejamento/epics-board'
import { TimelineBoard } from '@/components/planejamento/timeline-board'
import type { PlanejamentoEpico } from '@/lib/planejamento-api'

const stats: PlanningStat[] = [
  { label: 'Capacidade disponível', value: '340 pts', subLabel: 'Quarter atual' },
  { label: 'Comprometido', value: '280 pts', progress: 82 },
  { label: 'Features em risco', value: 3, tone: 'amber' },
  { label: 'Dependências críticas', value: 5, tone: 'rose' },
]

const epicos: PlanejamentoEpico[] = [
  {
    id: 'EP-001',
    titulo: 'Experiência de onboarding gamificada',
    descricao: 'Introduzir gamificação nas etapas iniciais para PMs novos.',
    status: 'IN_PROGRESS',
    health: 'YELLOW',
    quarter: 'Q2-2024',
    squadId: 'Squad Alpha',
    ownerId: 'PM-01',
    progressPercent: 55,
  },
  {
    id: 'EP-002',
    titulo: 'Discovery de monetização',
    descricao: 'Explorar novos fluxos de upsell colaborativo.',
    status: 'PLANNED',
    health: 'GREEN',
    quarter: 'Q3-2024',
    squadId: 'Squad Beta',
    ownerId: 'PM-02',
    progressPercent: 0,
  },
]

const timeline = {
  'Squad Alpha': {
    squadId: 'Squad Alpha',
    epicos: [
      {
        id: 'EP-001',
        titulo: 'Onboarding gamificado',
        status: 'IN_PROGRESS',
        quarter: 'Q2-2024',
        progressPercent: 55,
      },
    ],
  },
  'Squad Beta': {
    squadId: 'Squad Beta',
    epicos: [
      {
        id: 'EP-002',
        titulo: 'Discovery monetização',
        status: 'PLANNED',
        quarter: 'Q3-2024',
        progressPercent: 10,
      },
    ],
  },
}

const PlanejamentoPage = () => {
  const [epicoSelecionado, setEpicoSelecionado] = React.useState<string | null>(null)

  return (
    <div className="space-y-6">
      <PlanningStats stats={stats} />
      <div data-testid="board-epicos">
        <EpicsBoard epicos={epicos} onSelect={(id) => setEpicoSelecionado(id)} />
      </div>
      <div data-testid="timeline-board">
        <TimelineBoard timeline={timeline} />
      </div>

      <div data-testid="epico-detalhe">
        {epicoSelecionado
          ? `Épico selecionado: ${epicoSelecionado}`
          : 'Selecione um épico para ver detalhes.'}
      </div>
    </div>
  )
}

describe('Planejamento page integration', () => {
  it('apresenta métricas, board de épicos e timeline, reagindo à seleção', () => {
    renderWithProviders(<PlanejamentoPage />)

    expect(screen.getByText('Capacidade disponível')).toBeInTheDocument()
    expect(screen.getByText('340 pts')).toBeInTheDocument()
    const board = screen.getByTestId('board-epicos')
    expect(board).toHaveTextContent('Experiência de onboarding gamificada')
    expect(board).toHaveTextContent('Squad Alpha')
    expect(screen.getByText('Selecione um épico para ver detalhes.')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Experiência de onboarding gamificada'))
    expect(screen.getByTestId('epico-detalhe')).toHaveTextContent('EP-001')
  })
})
