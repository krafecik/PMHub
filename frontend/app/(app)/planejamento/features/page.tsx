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
import { listarFeatures } from '@/lib/planejamento-api'
import { FadeIn } from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const featuresHelpContent = (
  <div className="space-y-4">
    <p>
      Features são os blocos menores dentro dos épicos. Cada feature representa uma funcionalidade
      ou conjunto de funcionalidades que podem ser entregues de forma independente.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Status das Features:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Backlog:</strong> Feature definida mas ainda não priorizada
        </li>
        <li>
          <strong>Planejada:</strong> Feature priorizada e planejada para um épico
        </li>
        <li>
          <strong>Em Progresso:</strong> Desenvolvimento em andamento
        </li>
        <li>
          <strong>Bloqueada:</strong> Impedida por dependências ou problemas
        </li>
        <li>
          <strong>Concluída:</strong> Feature finalizada e entregue
        </li>
        <li>
          <strong>Em Espera:</strong> Temporariamente pausada
        </li>
      </ul>
    </div>
  </div>
)

const statusColors: Record<string, string> = {
  BACKLOG: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-200',
  PLANNED: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  BLOCKED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  ON_HOLD: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
}

const statusLabels: Record<string, string> = {
  BACKLOG: 'Backlog',
  PLANNED: 'Planejada',
  IN_PROGRESS: 'Em Progresso',
  BLOCKED: 'Bloqueada',
  DONE: 'Concluída',
  ON_HOLD: 'Em Espera',
}

export default function FeaturesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [quarterFilter, setQuarterFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [epicoFilter, _setEpicoFilter] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['features', searchTerm, quarterFilter, statusFilter, epicoFilter],
    queryFn: () =>
      listarFeatures({
        search: searchTerm || undefined,
        quarter: quarterFilter !== 'all' ? quarterFilter : undefined,
        status: statusFilter !== 'all' ? [statusFilter] : undefined,
        epicoId: epicoFilter || undefined,
      }),
  })

  const stats = useMemo(() => {
    if (!data?.data) return []
    const features = data.data
    return [
      {
        label: 'Total de Features',
        value: features.length,
        subLabel: 'Cadastradas',
      },
      {
        label: 'Em Progresso',
        value: features.filter((f) => f.status === 'IN_PROGRESS').length,
        subLabel: 'Ativas',
      },
      {
        label: 'Bloqueadas',
        value: features.filter((f) => f.status === 'BLOCKED').length,
        subLabel: 'Atenção necessária',
        tone: 'amber' as const,
      },
      {
        label: 'Concluídas',
        value: features.filter((f) => f.status === 'DONE').length,
        subLabel: 'Finalizadas',
        tone: 'emerald' as const,
      },
    ]
  }, [data])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Features</h1>
          <p className="text-text-secondary">
            Gerencie features e acompanhe o progresso das entregas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton title="Ajuda - Features" content={featuresHelpContent} />
          <Button onClick={() => router.push('/planejamento/features/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Feature
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
              placeholder="Buscar features..."
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
        </div>
      </Card>

      {/* Lista de Features */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <Card variant="ghost" className="p-12">
          <AnimatedEmptyState
            icon={<AnimatedIllustration type="empty" />}
            title="Nenhuma feature encontrada"
            description="Crie sua primeira feature para começar."
            action={
              <Button onClick={() => router.push('/planejamento/features/novo')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Feature
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.data.map((feature, index) => (
            <FadeIn key={feature.id} delay={index * 0.05}>
              <Card
                variant="elevated"
                className="cursor-pointer transition hover:-translate-y-0.5 hover:border-primary-200"
                onClick={() => router.push(`/planejamento/features/${feature.id}`)}
              >
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary">{feature.titulo}</h3>
                    </div>
                    <Badge variant="secondary" className={statusColors[feature.status]}>
                      {statusLabels[feature.status] || feature.status}
                    </Badge>
                  </div>

                  {feature.descricao && (
                    <p className="line-clamp-2 text-sm text-text-secondary">{feature.descricao}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {feature.pontos && (
                      <Badge variant="outline" className="text-xs">
                        {feature.pontos} pts
                      </Badge>
                    )}
                    {feature.squadId && (
                      <Badge variant="outline" className="text-xs">
                        Squad {feature.squadId}
                      </Badge>
                    )}
                    {feature.epicoId && (
                      <Badge variant="outline" className="text-xs">
                        Épico {feature.epicoId}
                      </Badge>
                    )}
                  </div>

                  {feature.dependenciasIds && feature.dependenciasIds.length > 0 && (
                    <div className="text-xs text-text-muted">
                      {feature.dependenciasIds.length} dependência(s)
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
