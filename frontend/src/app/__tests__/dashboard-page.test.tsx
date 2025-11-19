import React from 'react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { ProductHealth } from '@/components/dashboard/product-health'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'

vi.mock('recharts', () => {
  const Primitive = ({ children, ...props }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-primitive" {...props}>
      {children}
    </div>
  )

  const NullComponent = () => null

  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-container">{children}</div>
    ),
    AreaChart: Primitive,
    Area: NullComponent,
    CartesianGrid: NullComponent,
    XAxis: NullComponent,
    YAxis: NullComponent,
    Tooltip: NullComponent,
    Legend: NullComponent,
    BarChart: Primitive,
    Bar: NullComponent,
    LineChart: Primitive,
    Line: NullComponent,
    PieChart: Primitive,
    Pie: NullComponent,
    Cell: NullComponent,
  }
})

const chartData = [
  { name: 'Sprint 1', value: 18 },
  { name: 'Sprint 2', value: 22 },
  { name: 'Sprint 3', value: 20 },
]

const healthMetrics = [
  {
    name: 'Retenção',
    value: 82,
    target: 90,
    status: 'warning',
    trend: 'down',
    description: 'Meta impactada pela queda em onboarding.',
  },
  {
    name: 'NPS',
    value: 45,
    target: 40,
    status: 'good',
    trend: 'up',
    description: 'Melhora após ajustes de comunicação.',
  },
  {
    name: 'Cycle Time',
    value: 7,
    target: 5,
    status: 'critical',
    trend: 'up',
    description: 'Atenção com gargalos de desenvolvimento.',
  },
]

const activities = [
  {
    id: '1',
    type: 'ideia',
    title: 'Nova ideia registrada',
    description: 'Automação de relatórios executivos',
    user: { name: 'Ana Souza' },
    timestamp: new Date(),
    status: 'info',
    metadata: {
      produto: 'Produto Atlas',
      actionUrl: '/demandas/1',
      tags: ['ideação', 'relatórios'],
    },
  },
  {
    id: '2',
    type: 'discovery',
    title: 'Discovery finalizado',
    description: 'Hipótese de conversão validada com 84% de confiança',
    user: { name: 'Luiz Silva' },
    timestamp: new Date(),
    status: 'success',
    metadata: { produto: 'Produto Atlas' },
  },
]

const DashboardPage = () => (
  <div className="space-y-6">
    <OverviewChart
      title="Entregas por Sprint"
      description="Velocidade média considerando os últimos três ciclos."
      data={chartData}
      dataKeys={['value']}
    />
    <ProductHealth product="Produto Atlas" metrics={healthMetrics} />
    <QuickActions />
    <ActivityTimeline activities={activities} />
  </div>
)

describe('Dashboard page integration', () => {
  it('exibe seções principais do dashboard com dados agregados', () => {
    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Entregas por Sprint')).toBeInTheDocument()
    expect(
      screen.getByText('Velocidade média considerando os últimos três ciclos.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('recharts-container')).toBeInTheDocument()

    expect(screen.getByText('Saúde do Produto')).toBeInTheDocument()
    expect(screen.getByText('Retenção')).toBeInTheDocument()
    expect(screen.getByText('NPS')).toBeInTheDocument()

    expect(screen.getByText('Ações Rápidas')).toBeInTheDocument()
    expect(screen.getByText('Nova Ideia')).toBeInTheDocument()

    expect(screen.getByText('Atividade Recente')).toBeInTheDocument()
    expect(screen.getByText('Nova ideia registrada')).toBeInTheDocument()
    expect(screen.getByText('Discovery finalizado')).toBeInTheDocument()
  })
})
