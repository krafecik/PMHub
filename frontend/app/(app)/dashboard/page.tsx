'use client'

import { useAuthStore } from '@/store/auth-store'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ProductHealth } from '@/components/dashboard/product-health'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/motion'
import { Lightbulb, GitBranch, TrendingUp, Package2, Users, Calendar, Target } from 'lucide-react'

// Dados mockados para demonstração
const mockActivities = [
  {
    id: '1',
    type: 'ideia' as const,
    title: 'Nova funcionalidade de relatórios sugerida',
    description: 'Cliente solicitou dashboard personalizado para acompanhar métricas',
    user: { name: 'Ana Silva' },
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
    status: 'info' as const,
    metadata: {
      produto: 'ERP Core',
      tags: ['dashboard', 'relatórios', 'cliente'],
    },
  },
  {
    id: '2',
    type: 'validacao' as const,
    title: 'Teste A/B do novo onboarding concluído',
    description: 'Taxa de conclusão aumentou de 45% para 72%',
    user: { name: 'Carlos Mendes' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    status: 'success' as const,
    metadata: {
      produto: 'CRM',
      actionUrl: '/validacoes/123',
    },
  },
  {
    id: '3',
    type: 'decisao' as const,
    title: 'Priorização do roadmap Q1 2025',
    description: 'Definidas as 5 principais features para o próximo trimestre',
    user: { name: 'João Paulo' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    status: 'warning' as const,
    metadata: {
      produto: 'Fiscal',
      tags: ['roadmap', 'planejamento'],
    },
  },
]

const mockChartData = [
  { name: 'Jan', ideias: 24, discoveries: 8, features: 12 },
  { name: 'Fev', ideias: 30, discoveries: 12, features: 15 },
  { name: 'Mar', ideias: 28, discoveries: 15, features: 18 },
  { name: 'Abr', ideias: 35, discoveries: 10, features: 14 },
  { name: 'Mai', ideias: 40, discoveries: 18, features: 22 },
  { name: 'Jun', ideias: 38, discoveries: 20, features: 25 },
]

const mockProductHealth = [
  {
    name: 'Taxa de Adoção',
    value: 85,
    target: 100,
    status: 'good' as const,
    trend: 'up' as const,
    description: 'Novos usuários ativos nos últimos 30 dias',
  },
  {
    name: 'NPS Score',
    value: 72,
    target: 80,
    status: 'warning' as const,
    trend: 'stable' as const,
    description: 'Satisfação média dos clientes',
  },
  {
    name: 'Velocidade de Entrega',
    value: 18,
    target: 20,
    status: 'good' as const,
    trend: 'up' as const,
    description: 'Features entregues por sprint',
  },
  {
    name: 'Taxa de Bugs',
    value: 12,
    target: 5,
    status: 'critical' as const,
    trend: 'down' as const,
    description: 'Bugs críticos por release',
  },
]

const mockDistributionData = [
  { name: 'ERP Core', value: 35 },
  { name: 'CRM', value: 25 },
  { name: 'Fiscal', value: 20 },
  { name: 'Produção', value: 15 },
  { name: 'Outros', value: 5 },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn direction="down">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Olá, {user?.nome?.split(' ')[0]} 👋
            </h1>
            <p className="mt-2 text-text-secondary">
              Aqui está o resumo das atividades de produto desta semana
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 lg:flex">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </FadeIn>

      {/* Métricas principais */}
      <StaggerChildren className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            title="Ideias Capturadas"
            value="127"
            description="12 novas esta semana"
            trend={{ value: 15, label: 'vs. semana anterior' }}
            icon={<Lightbulb className="h-5 w-5" />}
            href="/demandas"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Features em Dev"
            value="23"
            description="8 em fase de testes"
            trend={{ value: -5, label: 'vs. mês anterior' }}
            icon={<GitBranch className="h-5 w-5" />}
            href="/planejamento"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Taxa de Sucesso"
            value="87%"
            description="Validações aprovadas"
            trend={{ value: 12, label: 'vs. trimestre anterior' }}
            icon={<Target className="h-5 w-5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Usuários Impactados"
            value="4.2K"
            description="Por novas features"
            trend={{ value: 32, label: 'crescimento mensal' }}
            icon={<Users className="h-5 w-5" />}
          />
        </StaggerItem>
      </StaggerChildren>

      {/* Gráficos e Atividades */}
      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn className="space-y-6 lg:col-span-2" delay={0.3}>
          <OverviewChart
            title="Fluxo de Produto"
            description="Evolução mensal de ideias, discoveries e features"
            data={mockChartData}
            type="area"
            dataKeys={['ideias', 'discoveries', 'features']}
            height={300}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <OverviewChart
              title="Distribuição por Produto"
              description="Onde estamos focando esforços"
              data={mockDistributionData}
              type="pie"
              height={250}
              showLegend={false}
            />

            <ProductHealth product="Portfolio Geral" metrics={mockProductHealth} />
          </div>
        </FadeIn>

        <FadeIn className="space-y-6" delay={0.4}>
          <QuickActions />
          <ActivityTimeline activities={mockActivities} />
        </FadeIn>
      </div>

      {/* Status dos Módulos */}
      <FadeIn delay={0.5}>
        <div className="rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 p-6 dark:from-primary-950 dark:to-accent-950">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
              <Package2 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary">
                Módulos em Desenvolvimento
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Estamos trabalhando para trazer novos módulos de ProductOps. Em breve: Captura de
                Demandas, Discovery e Roadmap Visual.
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary-400" />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
