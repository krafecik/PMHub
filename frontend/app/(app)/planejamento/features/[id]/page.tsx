'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Edit, AlertTriangle, CheckCircle2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpButton } from '@/components/ui/help-button'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import {
  obterFeature,
  listarTodasDependencias,
  listarFeatures,
  sugerirDependenciasIa,
} from '@/lib/planejamento-api'
import { FadeIn } from '@/components/motion'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'
import { AiButton } from '@/components/ui/ai-button'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const featureDetalheHelpContent = (
  <div className="space-y-4">
    <p>
      Esta página exibe todas as informações detalhadas da feature, incluindo descrição, pontos,
      dependências, riscos e critérios de aceite.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Informações:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Pontos:</strong> Estimativa de esforço (story points)
        </li>
        <li>
          <strong>Dependências:</strong> Features que devem ser concluídas antes desta
        </li>
        <li>
          <strong>Riscos:</strong> Problemas potenciais identificados
        </li>
        <li>
          <strong>Critérios de Aceite:</strong> Condições para considerar a feature concluída
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

export default function FeatureDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const featureId = params.id
  const { toast } = useToast()
  const [dependenciasModalOpen, setDependenciasModalOpen] = useState(false)
  const [dependenciasIa, setDependenciasIa] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['feature-detalhe', featureId],
    queryFn: () => obterFeature(featureId),
  })

  // Buscar dependências da feature
  const { data: dependenciasData } = useQuery({
    queryKey: ['dependencias-feature', featureId],
    queryFn: () => listarTodasDependencias({ featureId }),
    enabled: !!featureId,
  })

  // Buscar todas as features para mapear IDs para nomes
  const { data: allFeaturesData } = useQuery({
    queryKey: ['all-features'],
    queryFn: () => listarFeatures({}),
  })

  const featuresMap =
    allFeaturesData?.data?.reduce((acc: Record<string, any>, feature) => {
      acc[feature.id] = feature
      return acc
    }, {}) || {}

  const dependenciasMutation = useMutation({
    mutationFn: () => sugerirDependenciasIa(featureId),
    onSuccess: (result) => {
      setDependenciasIa(result)
      setDependenciasModalOpen(true)
      toast({
        title: 'Dependências sugeridas',
        description: 'A IA analisou a feature e sugeriu possíveis dependências.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao sugerir dependências',
        description: error?.message || 'Não foi possível gerar as sugestões.',
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

  if (!data) {
    return (
      <Card variant="ghost" className="p-12">
        <AnimatedEmptyState
          icon={<AnimatedIllustration type="empty" />}
          title="Feature não encontrada"
          description="A feature solicitada não existe ou foi removida."
          action={
            <Button onClick={() => router.push('/planejamento/features')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Features
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/planejamento/features')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold text-text-primary">{data.titulo}</h1>
              <Badge variant="secondary" className={statusColors[data.status]}>
                {statusLabels[data.status] || data.status}
              </Badge>
            </div>
            <p className="text-text-secondary">
              Épico: {data.epicoId} | Squad: {data.squadId || 'Não definido'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AiButton
            onGenerate={() => dependenciasMutation.mutateAsync()}
            label="Sugerir Dependências"
            loadingLabel="Analisando..."
            disabled={dependenciasMutation.isPending}
          />
          <HelpButton title="Ajuda - Detalhe da Feature" content={featureDetalheHelpContent} />
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conteúdo Principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Descrição */}
          {data.descricao && (
            <FadeIn>
              <Card variant="outline" className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Descrição</h2>
                <p className="whitespace-pre-wrap text-text-secondary">{data.descricao}</p>
              </Card>
            </FadeIn>
          )}

          {/* Informações Técnicas */}
          <FadeIn delay={0.1}>
            <Card variant="outline" className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Informações</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {data.pontos && (
                  <div>
                    <p className="mb-1 text-xs text-text-muted">Pontos (Story Points)</p>
                    <p className="text-sm font-medium text-text-primary">{data.pontos} pts</p>
                  </div>
                )}
                {data.revisadoPorId && (
                  <div>
                    <p className="mb-1 text-xs text-text-muted">Revisado por</p>
                    <p className="text-sm font-medium text-text-primary">{data.revisadoPorId}</p>
                  </div>
                )}
                {data.squadId && (
                  <div>
                    <p className="mb-1 text-xs text-text-muted">Squad</p>
                    <p className="text-sm font-medium text-text-primary">{data.squadId}</p>
                  </div>
                )}
                {data.epicoId && (
                  <div>
                    <p className="mb-1 text-xs text-text-muted">Épico</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm font-medium"
                      onClick={() => router.push(`/planejamento/epicos/${data.epicoId}`)}
                    >
                      Ver Épico
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </FadeIn>

          {/* Dependências */}
          {(dependenciasData && dependenciasData.length > 0) ||
          (data.dependenciasIds && data.dependenciasIds.length > 0) ? (
            <FadeIn delay={0.2}>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Dependências</h2>
                </div>
                <div className="space-y-2">
                  {dependenciasData && dependenciasData.length > 0
                    ? dependenciasData.map((dep) => {
                        const featureBloqueadora = featuresMap[dep.featureBloqueadoraId]
                        const getRiscoColor = (risco: string) => {
                          switch (risco) {
                            case 'CRITICO':
                              return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                            case 'ALTO':
                              return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                            case 'MEDIO':
                              return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                            default:
                              return 'bg-secondary-100 text-secondary-700'
                          }
                        }
                        const getTipoLabel = (tipo: string) => {
                          switch (tipo) {
                            case 'HARD':
                              return 'Hard'
                            case 'SOFT':
                              return 'Soft'
                            case 'RECURSO':
                              return 'Recurso'
                            default:
                              return tipo
                          }
                        }
                        return (
                          <div
                            key={dep.id}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition hover:bg-secondary-50 dark:hover:bg-secondary-900/50"
                            onClick={() =>
                              router.push(`/planejamento/features/${dep.featureBloqueadoraId}`)
                            }
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text-primary">
                                  {featureBloqueadora?.titulo ||
                                    `Feature ${dep.featureBloqueadoraId}`}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn('text-xs', getRiscoColor(dep.risco))}
                                >
                                  {getTipoLabel(dep.tipo)} - {dep.risco}
                                </Badge>
                              </div>
                              {dep.nota && (
                                <p className="mt-1 text-xs text-text-muted">{dep.nota}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </div>
                        )
                      })
                    : data.dependenciasIds?.map((depId) => {
                        const feature = featuresMap[depId]
                        return (
                          <div
                            key={depId}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition hover:bg-secondary-50 dark:hover:bg-secondary-900/50"
                            onClick={() => router.push(`/planejamento/features/${depId}`)}
                          >
                            <span className="text-sm font-medium text-text-primary">
                              {feature?.titulo || `Feature ${depId}`}
                            </span>
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </div>
                        )
                      })}
                </div>
              </Card>
            </FadeIn>
          ) : null}

          {/* Critérios de Aceite */}
          {data.criteriosAceite && (
            <FadeIn delay={0.3}>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Critérios de Aceite</h2>
                </div>
                <ul className="space-y-2">
                  {data.criteriosAceite.split('\n').map((criterio: string, index: number) => (
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
          {data.riscos && (
            <FadeIn delay={0.4}>
              <Card variant="outline" className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-text-primary">Riscos</h2>
                </div>
                <ul className="space-y-2">
                  {data.riscos.split('\n').map((risco: string, index: number) => (
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
                  <p className="mb-1 text-text-muted">Status</p>
                  <Badge variant="secondary" className={statusColors[data.status]}>
                    {statusLabels[data.status] || data.status}
                  </Badge>
                </div>
                {data.pontos && (
                  <div>
                    <p className="mb-1 text-text-muted">Pontos</p>
                    <p className="font-medium text-text-primary">{data.pontos} pts</p>
                  </div>
                )}
                {data.squadId && (
                  <div>
                    <p className="mb-1 text-text-muted">Squad</p>
                    <p className="font-medium text-text-primary">{data.squadId}</p>
                  </div>
                )}
                {data.createdAt && (
                  <div>
                    <p className="mb-1 text-text-muted">Criado em</p>
                    <p className="font-medium text-text-primary">
                      {formatRelativeDate(new Date(data.createdAt))}
                    </p>
                  </div>
                )}
                {data.updatedAt && (
                  <div>
                    <p className="mb-1 text-text-muted">Atualizado em</p>
                    <p className="font-medium text-text-primary">
                      {formatRelativeDate(new Date(data.updatedAt))}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>

      {/* Modal de Dependências Sugeridas IA */}
      <Dialog open={dependenciasModalOpen} onOpenChange={setDependenciasModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dependências Sugeridas</DialogTitle>
            <DialogDescription>
              A IA analisou a feature e sugeriu possíveis dependências baseadas em similaridade e
              contexto.
            </DialogDescription>
          </DialogHeader>
          {dependenciasIa?.dependenciasSugeridas &&
          dependenciasIa.dependenciasSugeridas.length > 0 ? (
            <div className="space-y-3">
              {dependenciasIa.dependenciasSugeridas.map((sugestao: any, index: number) => {
                const feature = featuresMap[sugestao.idFeature]
                return (
                  <Card key={index} variant="outline" className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {feature?.titulo || `Feature ${sugestao.idFeature}`}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">{sugestao.justificativa}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {sugestao.tipo}
                          </Badge>
                          <Badge
                            variant={
                              sugestao.risco === 'ALTO'
                                ? 'destructive'
                                : sugestao.risco === 'MEDIO'
                                  ? 'warning'
                                  : 'success'
                            }
                            className="text-xs"
                          >
                            {sugestao.risco}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/planejamento/features/${sugestao.idFeature}`)}
                      >
                        Ver Feature
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-text-secondary">
              Nenhuma dependência sugerida pela IA.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
