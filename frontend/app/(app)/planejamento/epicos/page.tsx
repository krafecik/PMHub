'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpButton } from '@/components/ui/help-button'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { listarEpicos } from '@/lib/planejamento-api'
import { FadeIn } from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const epicosHelpContent = (
  <div className="space-y-4">
    <p>
      Os épicos são grandes iniciativas que agrupam múltiplas features e representam entregas
      estratégicas de alto nível.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Status dos Épicos:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Planejado:</strong> Épico definido mas ainda não iniciado
        </li>
        <li>
          <strong>Em Progresso:</strong> Trabalho ativo no épico
        </li>
        <li>
          <strong>Em Risco:</strong> Possíveis atrasos ou problemas identificados
        </li>
        <li>
          <strong>Concluído:</strong> Épico finalizado
        </li>
        <li>
          <strong>Em Espera:</strong> Temporariamente pausado
        </li>
      </ul>
    </div>
    <div>
      <h3 className="mb-2 font-semibold">Health Score:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Verde:</strong> Tudo dentro do esperado
        </li>
        <li>
          <strong>Amarelo:</strong> Atenção necessária
        </li>
        <li>
          <strong>Vermelho:</strong> Ação imediata requerida
        </li>
      </ul>
    </div>
  </div>
)

const statusColors: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  AT_RISK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  ON_HOLD: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
}

const healthMap: Record<string, { label: string; color: string }> = {
  GREEN: { label: 'On Track', color: 'bg-emerald-500/10 text-emerald-500' },
  YELLOW: { label: 'At Risk', color: 'bg-amber-500/10 text-amber-500' },
  RED: { label: 'Blocked', color: 'bg-rose-500/10 text-rose-500' },
}

const statusLabels: Record<string, string> = {
  PLANNED: 'Planejado',
  IN_PROGRESS: 'Em Progresso',
  AT_RISK: 'Em Risco',
  DONE: 'Concluído',
  ON_HOLD: 'Em Espera',
}

export default function EpicosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [quarterFilter, setQuarterFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [healthFilter, setHealthFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['epicos', searchTerm, quarterFilter, statusFilter, healthFilter],
    queryFn: () => {
      const params: { search?: string; quarter?: string; status?: string[] } = {}
      if (searchTerm) {
        params.search = searchTerm
      }
      if (quarterFilter && quarterFilter !== 'all') {
        params.quarter = quarterFilter
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = [statusFilter]
      }
      return listarEpicos(params)
    },
  })

  const filteredEpicos = useMemo(() => {
    if (!data?.data) return []
    let filtered = data.data

    if (healthFilter && healthFilter !== 'all') {
      filtered = filtered.filter((epico) => epico.health === healthFilter)
    }

    return filtered
  }, [data, healthFilter])

  const stats = useMemo(() => {
    if (!data?.data) return []
    const epicos = data.data
    return [
      {
        label: 'Total de Épicos',
        value: epicos.length,
        subLabel: 'Neste quarter',
      },
      {
        label: 'Em Progresso',
        value: epicos.filter((e) => e.status === 'IN_PROGRESS').length,
        subLabel: 'Ativos',
      },
      {
        label: 'Em Risco',
        value: epicos.filter((e) => e.health === 'RED').length,
        subLabel: 'Atenção necessária',
        tone: 'amber' as const,
      },
      {
        label: 'Concluídos',
        value: epicos.filter((e) => e.status === 'DONE').length,
        subLabel: 'Finalizados',
        tone: 'emerald' as const,
      },
    ]
  }, [data])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Épicos</h1>
          <p className="text-text-secondary">
            Gerencie épicos estratégicos e acompanhe o progresso das iniciativas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton title="Ajuda - Épicos" content={epicosHelpContent} />
          <Button onClick={() => router.push('/planejamento/epicos/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Épico
          </Button>
        </div>
      </header>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.1}>
              <Card variant="outline" className="p-4">
                <p className="text-sm text-text-muted">{stat.label}</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    stat.tone === 'amber' && 'text-amber-600',
                    stat.tone === 'emerald' && 'text-emerald-600',
                  )}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-text-secondary">{stat.subLabel}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}

      {/* Filtros */}
      <Card variant="outline" className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar épicos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={quarterFilter} onValueChange={setQuarterFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Q1 2026">Q1 2026</SelectItem>
              <SelectItem value="Q2 2026">Q2 2026</SelectItem>
              <SelectItem value="Q3 2026">Q3 2026</SelectItem>
              <SelectItem value="Q4 2026">Q4 2026</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(healthMap).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Épicos */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredEpicos.length === 0 ? (
        <Card variant="ghost" className="p-12">
          <AnimatedEmptyState
            icon={<AnimatedIllustration type="empty" />}
            title="Nenhum épico encontrado"
            description="Crie seu primeiro épico para começar o planejamento."
            action={
              <Button onClick={() => router.push('/planejamento/epicos/novo')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Épico
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEpicos.map((epico, index) => (
            <FadeIn key={epico.id} delay={index * 0.05}>
              <Card
                variant="elevated"
                className="cursor-pointer transition hover:-translate-y-0.5 hover:border-primary-200"
                onClick={() => router.push(`/planejamento/epicos/${epico.id}`)}
              >
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-text-muted">
                        {epico.quarter}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-text-primary">
                        {epico.titulo}
                      </h3>
                    </div>
                    <Badge className={cn(healthMap[epico.health]?.color || '')}>
                      {healthMap[epico.health]?.label || epico.health}
                    </Badge>
                  </div>

                  {epico.descricao && (
                    <p className="line-clamp-2 text-sm text-text-secondary">{epico.descricao}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={statusColors[epico.status]}>
                      {statusLabels[epico.status] || epico.status}
                    </Badge>
                    {epico.squadId && (
                      <Badge variant="outline" className="text-xs">
                        Squad {epico.squadId}
                      </Badge>
                    )}
                  </div>

                  {epico.progressPercent !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Progresso</span>
                        <span className="font-medium text-text-primary">
                          {epico.progressPercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-800">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{ width: `${epico.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}
