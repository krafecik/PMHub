'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpButton } from '@/components/ui/help-button'
import { CheckCircle2, AlertTriangle, Clock, Calendar } from 'lucide-react'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { listarPlanningCycles, obterPlanningCycle } from '@/lib/planejamento-api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const planningHelpContent = (
  <div className="space-y-4">
    <p>
      O Planning Trimestral é o processo de preparação e execução do planejamento estratégico para
      cada quarter.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Fases do Planning:</h3>
      <ol className="list-inside list-decimal space-y-1 text-sm">
        <li>
          <strong>Preparação:</strong> OKRs definidos, backlog priorizado, métricas do quarter
          anterior
        </li>
        <li>
          <strong>Discovery:</strong> Validação de hipóteses e descobertas
        </li>
        <li>
          <strong>Planejamento:</strong> Criação de épicos, features e estimativas
        </li>
        <li>
          <strong>Revisão:</strong> Validação técnica, ajustes de capacidade
        </li>
        <li>
          <strong>Commitment:</strong> Assinatura e compromisso com entregas
        </li>
      </ol>
    </div>
    <div>
      <h3 className="mb-2 font-semibold">Checklist de Preparação:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>OKRs definidos e alinhados</li>
        <li>Backlog priorizado</li>
        <li>Métricas do quarter anterior analisadas</li>
        <li>Lista de dívidas técnicas completa</li>
        <li>Dependências mapeadas</li>
        <li>Capacidade preliminar calculada</li>
      </ul>
    </div>
  </div>
)

interface PlanningPhase {
  id: number
  name: string
  status: 'completed' | 'current' | 'pending'
  description: string
  checklist: Array<{ label: string; completed: boolean }>
}

const PLANNING_PHASES: PlanningPhase[] = [
  {
    id: 1,
    name: 'Preparação',
    status: 'completed',
    description: 'OKRs definidos, backlog priorizado, métricas Q4',
    checklist: [
      { label: 'OKRs definidos', completed: true },
      { label: 'Backlog priorizado', completed: true },
      { label: 'Métricas Q4', completed: true },
      { label: 'Lista de dívidas técnicas incompleta', completed: false },
      { label: 'Dependências', completed: true },
      { label: 'Capacidade preliminar', completed: true },
    ],
  },
  {
    id: 2,
    name: 'Discovery',
    status: 'current',
    description: 'Validação de hipóteses e descobertas',
    checklist: [
      { label: 'Hipóteses validadas', completed: false },
      { label: 'Experimentos concluídos', completed: false },
      { label: 'Insights consolidados', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Planejamento',
    status: 'pending',
    description: 'Criação de épicos, features e estimativas',
    checklist: [
      { label: 'Épicos criados', completed: false },
      { label: 'Features definidas', completed: false },
      { label: 'Estimativas realizadas', completed: false },
    ],
  },
  {
    id: 4,
    name: 'Revisão',
    status: 'pending',
    description: 'Validação técnica, ajustes de capacidade',
    checklist: [
      { label: 'Revisão técnica concluída', completed: false },
      { label: 'Capacidade ajustada', completed: false },
      { label: 'Riscos mapeados', completed: false },
    ],
  },
  {
    id: 5,
    name: 'Commitment',
    status: 'pending',
    description: 'Assinatura e compromisso com entregas',
    checklist: [
      { label: 'Commitment definido', completed: false },
      { label: 'Assinaturas coletadas', completed: false },
      { label: 'Roadmap publicado', completed: false },
    ],
  },
]

export default function PlanningTrimestralPage() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q1 2026')

  const { data: cycles = [], isLoading: isLoadingCycles } = useQuery({
    queryKey: ['planning-cycles', selectedQuarter],
    queryFn: () => listarPlanningCycles({ quarter: selectedQuarter }),
  })

  const currentCycle = cycles[0]

  const { data: cycleDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['planning-cycle', currentCycle?.id],
    queryFn: () => obterPlanningCycle(currentCycle!.id),
    enabled: !!currentCycle?.id,
  })

  const participantsConfirmed = {
    current: cycleDetail?.participantesConfirmados || 0,
    total: cycleDetail?.participantesTotais || 0,
  }

  const faseAtual = cycleDetail?.faseAtual || 1
  const checklist = cycleDetail?.checklist || []

  // Mapear fase atual para status das fases
  const getPhaseStatus = (phaseId: number) => {
    if (phaseId < faseAtual) return 'completed'
    if (phaseId === faseAtual) return 'current'
    return 'pending'
  }

  const phasesWithStatus = PLANNING_PHASES.map((phase) => ({
    ...phase,
    status: getPhaseStatus(phase.id),
    checklist:
      phase.id === faseAtual
        ? checklist.map((item) => ({
            label: item.label,
            completed: item.concluido,
          }))
        : phase.checklist,
  }))

  const currentPhase = phasesWithStatus.find((phase) => phase.status === 'current')
  const completedPhases = phasesWithStatus.filter((phase) => phase.status === 'completed').length
  const totalPhases = phasesWithStatus.length

  const isLoading = isLoadingCycles || isLoadingDetail

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Planning {selectedQuarter}</h1>
          <p className="text-text-secondary">
            Gerencie o processo completo de planejamento trimestral com fases, checklists e
            participantes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1 2026">Q1 2026</SelectItem>
              <SelectItem value="Q2 2026">Q2 2026</SelectItem>
              <SelectItem value="Q3 2026">Q3 2026</SelectItem>
              <SelectItem value="Q4 2026">Q4 2026</SelectItem>
            </SelectContent>
          </Select>
          <HelpButton title="Ajuda - Planning Trimestral" content={planningHelpContent} />
          {!currentCycle && <Button>Iniciar Planning</Button>}
        </div>
      </header>

      {isLoading ? (
        <Card variant="outline" className="p-6">
          <p className="text-text-secondary">Carregando planning...</p>
        </Card>
      ) : !currentCycle ? (
        <Card variant="outline" className="p-6">
          <AnimatedEmptyState
            icon={<AnimatedIllustration type="empty" />}
            title="Nenhum planning iniciado"
            description="Inicie um novo planning trimestral para começar o processo de planejamento."
          />
        </Card>
      ) : (
        <>
          {/* Status Card */}
          <Card variant="elevated" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-text-primary">Status do Planning</h2>
                  <Badge
                    variant={
                      cycleDetail?.statusSlug === 'completed'
                        ? 'success'
                        : cycleDetail?.statusSlug === 'in_progress'
                          ? 'default'
                          : 'secondary'
                    }
                    className="gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {cycleDetail?.statusLabel || 'Em andamento'}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">
                  Participantes confirmados: {participantsConfirmed.current}/
                  {participantsConfirmed.total}
                </p>
                {cycleDetail?.agendaUrl && (
                  <a
                    href={cycleDetail.agendaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Ver agenda completa →
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-text-muted">Fase atual</p>
                <p className="text-2xl font-bold text-text-primary">
                  {completedPhases}/{totalPhases}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {currentPhase?.name || 'Concluído'}
                  </span>
                  <Badge
                    variant={currentPhase?.status === 'current' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {currentPhase?.status === 'current' ? 'Em andamento' : 'Concluído'}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">{currentPhase?.description}</p>
              </div>

              {currentPhase && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-sm font-medium text-text-primary">Checklist:</p>
                  <div className="space-y-1.5">
                    {currentPhase.checklist.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-border" />
                        )}
                        <span
                          className={
                            item.completed
                              ? 'text-text-secondary line-through'
                              : 'text-text-primary'
                          }
                        >
                          {item.label}
                        </span>
                        {!item.completed && item.label.includes('incompleta') && (
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" size="sm">
                Ver checklist completo
              </Button>
              {cycleDetail?.agendaUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={cycleDetail.agendaUrl} target="_blank" rel="noopener noreferrer">
                    Ver agenda completa
                  </a>
                </Button>
              )}
            </div>
          </Card>

          {/* Fases do Planning */}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Fases do Planning</h2>
              <p className="text-sm text-text-secondary">
                Acompanhe o progresso de cada fase do planejamento trimestral.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {phasesWithStatus.map((phase) => (
                <Card
                  key={phase.id}
                  variant={phase.status === 'current' ? 'elevated' : 'outline'}
                  className="p-5"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                      flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                      ${
                        phase.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : phase.status === 'current'
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400'
                            : 'bg-secondary-200 text-text-muted dark:bg-secondary-800'
                      }
                    `}
                      >
                        {phase.id}
                      </div>
                      <h3 className="font-semibold text-text-primary">{phase.name}</h3>
                    </div>
                    {phase.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>

                  <p className="mb-4 text-sm text-text-secondary">{phase.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Progresso</span>
                      <span className="font-medium text-text-primary">
                        {phase.checklist.filter((item) => item.completed).length}/
                        {phase.checklist.length}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-800">
                      <div
                        className="h-full bg-primary-600 transition-all"
                        style={{
                          width: `${
                            (phase.checklist.filter((item) => item.completed).length /
                              phase.checklist.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Próximos Passos */}
          <Card variant="outline" className="p-6">
            <div className="flex items-start gap-4">
              <Calendar className="mt-0.5 h-5 w-5 text-primary-600" />
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-text-primary">Próximos passos</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      Complete o checklist da fase atual ({currentPhase?.name || 'Concluído'}) para
                      avançar
                    </span>
                  </li>
                  {participantsConfirmed.current < participantsConfirmed.total && (
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>
                        Confirme a participação dos stakeholders restantes (
                        {participantsConfirmed.total - participantsConfirmed.current} faltando)
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      Revise as métricas do quarter anterior antes de iniciar o planejamento
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
