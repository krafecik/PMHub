'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Edit, Calendar, Target, AlertTriangle, FileText, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { HelpButton } from '@/components/ui/help-button'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import {
  obterEpico,
  sugerirPrioridadeEpicoIa,
  calcularHealthScoreEpicoIa,
  type PlanejamentoFeature,
} from '@/lib/planejamento-api'
import { FadeIn } from '@/components/motion'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'
import { UpdatesLog } from '@/components/planejamento/updates-log'
import { AiButton } from '@/components/ui/ai-button'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const epicoDetalheHelpContent = (
  <div className="space-y-4">
    <p>
      Esta página exibe todas as informações detalhadas do épico, incluindo features relacionadas,
      riscos, critérios de aceite e histórico de atualizações.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Seções:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Objetivo:</strong> O que será entregue e por quê
        </li>
        <li>
          <strong>Value Proposition:</strong> O valor que será gerado
        </li>
        <li>
          <strong>Features:</strong> Blocos menores que compõem o épico
        </li>
        <li>
          <strong>Riscos:</strong> Problemas potenciais identificados
        </li>
        <li>
          <strong>Critérios de Aceite:</strong> Condições para considerar o épico concluído
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

export default function EpicoDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const epicoId = params.id
  const { toast } = useToast()
  const [prioridadeModalOpen, setPrioridadeModalOpen] = useState(false)
  const [healthModalOpen, setHealthModalOpen] = useState(false)
  const [prioridadeIa, setPrioridadeIa] = useState<any>(null)
  const [healthIa, setHealthIa] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['epico-detalhe', epicoId],
    queryFn: () => obterEpico(epicoId),
  })

  const prioridadeMutation = useMutation({
    mutationFn: () => sugerirPrioridadeEpicoIa(epicoId),
    onSuccess: (result) => {
      setPrioridadeIa(result)
      setPrioridadeModalOpen(true)
      toast({
        title: 'Priorização sugerida',
        description: 'A IA analisou o épico e sugeriu uma priorização.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao sugerir priorização',
        description: error?.message || 'Não foi possível gerar a sugestão.',
        variant: 'destructive',
      })
    },
  })

  const healthMutation = useMutation({
    mutationFn: () => calcularHealthScoreEpicoIa(epicoId),
    onSuccess: (result) => {
      setHealthIa(result)
      setHealthModalOpen(true)
      toast({
        title: 'Health score avaliado',
        description: 'A IA avaliou o health score do épico.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao avaliar health score',
        description: error?.message || 'Não foi possível avaliar o health score.',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!data?.epico) {
    return (
      <Card variant="ghost" className="p-12">
        <AnimatedEmptyState
          icon={<AnimatedIllustration type="empty" />}
          title="Épico não encontrado"
          description="O épico solicitado não existe ou foi removido."
          action={
            <Button onClick={() => router.push('/planejamento/epicos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Épicos
            </Button>
          }
        />
      </Card>
    )
  }

  const { epico, features = [] } = data
  const featuresProgress = (features as PlanejamentoFeature[]).map((feature) => {
    const statusProgress: Record<string, number> = {
      PLANNED: 0,
      IN_PROGRESS: 50,
      BLOCKED: 25,
      DONE: 100,
      ON_HOLD: 0,
    }
    return {
      ...feature,
      progress: statusProgress[feature.status] || 0,
    }
  })

  const totalProgress =
    features.length > 0
      ? Math.round(
          featuresProgress.reduce((acc: number, feature) => acc + feature.progress, 0) /
            features.length,
        )
      : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/planejamento/epicos')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold text-text-primary">{epico.titulo}</h1>
              <Badge className={cn(healthMap[epico.health]?.color || '')}>
                {healthMap[epico.health]?.label || epico.health}
              </Badge>
              <Badge variant="secondary" className={statusColors[epico.status]}>
                {statusLabels[epico.status] || epico.status}
              </Badge>
            </div>
            <p className="text-text-secondary">
              Quarter: {epico.quarter} | Squad: {epico.squadId || 'Não definido'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AiButton
            onGenerate={() => prioridadeMutation.mutateAsync()}
            label="Sugerir Priorização"
            loadingLabel="Analisando..."
            disabled={prioridadeMutation.isPending}
          />
          <AiButton
            onGenerate={() => healthMutation.mutateAsync()}
            label="Avaliar Health"
            loadingLabel="Avaliando..."
            disabled={healthMutation.isPending}
          />
          <HelpButton title="Ajuda - Detalhe do Épico" content={epicoDetalheHelpContent} />
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Progresso Geral */}
      {features.length > 0 && (
        <Card variant="elevated" className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">Progresso Geral</span>
              <span className="text-sm font-semibold text-text-primary">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} />
            <p className="text-xs text-text-muted">
              {features.filter((f: any) => f.status === 'DONE').length} de {features.length}{' '}
              features concluídas
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conteúdo Principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Objetivo */}
          {epico.objetivo && (
            <FadeIn>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Objetivo</h2>
                </div>
                <p className="whitespace-pre-wrap text-text-secondary">{epico.objetivo}</p>
              </Card>
            </FadeIn>
          )}

          {/* Value Proposition */}
          {epico.valueProposition && (
            <FadeIn delay={0.1}>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Value Proposition</h2>
                </div>
                <p className="whitespace-pre-wrap text-text-secondary">{epico.valueProposition}</p>
              </Card>
            </FadeIn>
          )}

          {/* Datas */}
          {(epico.startDate || epico.endDate) && (
            <FadeIn delay={0.2}>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Datas Previstas</h2>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {epico.startDate && (
                    <div>
                      <p className="mb-1 text-xs text-text-muted">Início</p>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(epico.startDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {epico.endDate && (
                    <div>
                      <p className="mb-1 text-xs text-text-muted">Entrega Prevista</p>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(epico.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </FadeIn>
          )}

          {/* Features Relacionadas */}
          <FadeIn delay={0.3}>
            <Card variant="outline" className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-text-primary">
                    Features Relacionadas ({features.length})
                  </h2>
                </div>
                <Button variant="outline" size="sm">
                  Adicionar Feature
                </Button>
              </div>
              {features.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-secondary">
                  Nenhuma feature vinculada a este épico.
                </p>
              ) : (
                <div className="space-y-3">
                  {featuresProgress.map((feature: any) => (
                    <div
                      key={feature.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition hover:bg-secondary-50 dark:hover:bg-secondary-900/50"
                      onClick={() => router.push(`/planejamento/features/${feature.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{feature.titulo}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {feature.pontos && (
                            <Badge variant="outline" className="text-xs">
                              {feature.pontos} pts
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {feature.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-24">
                        <Progress value={feature.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </FadeIn>

          {/* Critérios de Aceite */}
          {epico.criteriosAceite && (
            <FadeIn delay={0.4}>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Critérios de Aceite</h2>
                </div>
                <ul className="space-y-2">
                  {epico.criteriosAceite.split('\n').map((criterio: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-text-secondary">
                      <span className="mt-1 text-emerald-600">✓</span>
                      <span>{criterio.trim()}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </FadeIn>
          )}

          {/* Riscos */}
          {epico.riscos && (
            <FadeIn delay={0.5}>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Riscos Identificados</h2>
                </div>
                <ul className="space-y-2">
                  {epico.riscos.split('\n').map((risco: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-text-secondary">
                      <span className="mt-1 text-amber-600">⚠</span>
                      <span>{risco.trim()}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </FadeIn>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações Gerais */}
          <FadeIn delay={0.2}>
            <Card variant="outline" className="p-6">
              <h3 className="mb-4 font-semibold text-text-primary">Informações</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 text-text-muted">Quarter</p>
                  <p className="font-medium text-text-primary">{epico.quarter}</p>
                </div>
                {epico.squadId && (
                  <div>
                    <p className="mb-1 text-text-muted">Squad</p>
                    <p className="font-medium text-text-primary">{epico.squadId}</p>
                  </div>
                )}
                {epico.ownerId && (
                  <div>
                    <p className="mb-1 text-text-muted">Owner</p>
                    <p className="font-medium text-text-primary">{epico.ownerId}</p>
                  </div>
                )}
                {epico.createdAt && (
                  <div>
                    <p className="mb-1 text-text-muted">Criado em</p>
                    <p className="font-medium text-text-primary">
                      {formatRelativeDate(new Date(epico.createdAt))}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </FadeIn>

          {/* Arquivos e Documentos */}
          <FadeIn delay={0.3}>
            <Card variant="outline" className="p-6">
              <h3 className="mb-4 font-semibold text-text-primary">Arquivos e Documentos</h3>
              <p className="text-sm text-text-secondary">
                Nenhum documento vinculado ainda. Use o botão Editar para adicionar.
              </p>
            </Card>
          </FadeIn>

          {/* Updates */}
          <FadeIn delay={0.4}>
            <UpdatesLog tipo="EPICO" entidadeId={epico.id} />
          </FadeIn>
        </div>
      </div>

      {/* Modal de Priorização IA */}
      <Dialog open={prioridadeModalOpen} onOpenChange={setPrioridadeModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sugestão de Priorização</DialogTitle>
            <DialogDescription>
              A IA analisou o épico e sugeriu uma priorização baseada em impacto, esforço e
              contexto.
            </DialogDescription>
          </DialogHeader>
          {prioridadeIa && (
            <div className="space-y-4">
              <div>
                <Badge
                  variant={
                    prioridadeIa.prioridade === 'ALTA'
                      ? 'destructive'
                      : prioridadeIa.prioridade === 'MEDIA'
                        ? 'warning'
                        : 'secondary'
                  }
                  className="px-4 py-2 text-lg"
                >
                  {prioridadeIa.prioridade}
                </Badge>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Justificativa:</h4>
                <p className="text-sm text-text-secondary">{prioridadeIa.justificativa}</p>
              </div>
              {prioridadeIa.alertas && prioridadeIa.alertas.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Alertas:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                    {prioridadeIa.alertas.map((alerta: string, index: number) => (
                      <li key={index}>{alerta}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Health Score IA */}
      <Dialog open={healthModalOpen} onOpenChange={setHealthModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Avaliação de Health Score</DialogTitle>
            <DialogDescription>
              A IA avaliou o health score do épico considerando progresso, dependências e riscos.
            </DialogDescription>
          </DialogHeader>
          {healthIa && (
            <div className="space-y-4">
              <div>
                <Badge
                  variant={
                    healthIa.health === 'GREEN'
                      ? 'success'
                      : healthIa.health === 'YELLOW'
                        ? 'warning'
                        : 'destructive'
                  }
                  className="px-4 py-2 text-lg"
                >
                  {healthIa.health === 'GREEN'
                    ? 'On Track'
                    : healthIa.health === 'YELLOW'
                      ? 'At Risk'
                      : 'Blocked'}
                </Badge>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Justificativa:</h4>
                <p className="text-sm text-text-secondary">{healthIa.justificativa}</p>
              </div>
              {healthIa.proximosPassos && healthIa.proximosPassos.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Próximos Passos:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                    {healthIa.proximosPassos.map((passo: string, index: number) => (
                      <li key={index}>{passo}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
