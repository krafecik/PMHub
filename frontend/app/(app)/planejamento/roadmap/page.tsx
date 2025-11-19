'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Presentation, ZoomIn, ZoomOut } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpButton } from '@/components/ui/help-button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  fetchTimeline,
  listarEpicos,
  listarFeatures,
  listarCommitments,
} from '@/lib/planejamento-api'
import { FadeIn } from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const roadmapHelpContent = (
  <div className="space-y-4">
    <p>
      Visualização de alta visibilidade do roadmap trimestral. Arraste épicos e features para
      ajustar datas e visualize o compromisso por tier (Committed, Targeted, Aspirational).
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Funcionalidades:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>Drag & drop para ajustar datas</li>
        <li>Visualização por produto/squad</li>
        <li>Cores por commitment tier</li>
        <li>Modo apresentação</li>
        <li>Zoom in/out</li>
      </ul>
    </div>
  </div>
)

export default function RoadmapPage() {
  const [quarter, setQuarter] = useState('Q1 2026')
  const [presentationMode, setPresentationMode] = useState(false)
  const [zoom, setZoom] = useState(1)

  const { isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['timeline', quarter],
    queryFn: () => fetchTimeline(quarter),
  })

  const { data: epicosData, isLoading: isLoadingEpicos } = useQuery({
    queryKey: ['epicos', quarter],
    queryFn: () => listarEpicos({ quarter }),
  })

  const { data: featuresData, isLoading: isLoadingFeatures } = useQuery({
    queryKey: ['features', quarter],
    queryFn: () => listarFeatures({ quarter }),
  })

  const { data: commitments = [] } = useQuery({
    queryKey: ['commitments', quarter],
    queryFn: () => listarCommitments({ quarter }),
  })

  const commitment = commitments[0]

  const isLoading = isLoadingTimeline || isLoadingEpicos || isLoadingFeatures

  // Agrupar épicos por produto/squad
  const epicosPorProduto =
    epicosData?.data?.reduce((acc: Record<string, any[]>, epico) => {
      const key = epico.squadId || 'Sem Squad'
      if (!acc[key]) acc[key] = []
      acc[key].push(epico)
      return acc
    }, {}) || {}

  const getCommitmentTier = (epicoId: string) => {
    if (!commitment) return null
    if (commitment.itens.committed.some((item: any) => item.id === epicoId)) return 'committed'
    if (commitment.itens.targeted.some((item: any) => item.id === epicoId)) return 'targeted'
    if (commitment.itens.aspirational.some((item: any) => item.id === epicoId))
      return 'aspirational'
    return null
  }

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'committed':
        return 'bg-emerald-500'
      case 'targeted':
        return 'bg-amber-500'
      case 'aspirational':
        return 'bg-slate-400'
      default:
        return 'bg-secondary-300'
    }
  }

  const getTierLabel = (tier: string | null) => {
    switch (tier) {
      case 'committed':
        return 'Committed'
      case 'targeted':
        return 'Targeted'
      case 'aspirational':
        return 'Aspirational'
      default:
        return 'Não definido'
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Roadmap Timeline</h1>
          <p className="text-text-secondary">
            Visualização contínua do quarter com épicos e features organizados por timeline.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={quarter} onValueChange={setQuarter}>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm text-text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="presentation-mode"
              checked={presentationMode}
              onCheckedChange={setPresentationMode}
            />
            <Label htmlFor="presentation-mode" className="flex cursor-pointer items-center gap-2">
              <Presentation className="h-4 w-4" />
              Modo Apresentação
            </Label>
          </div>
          <HelpButton title="Ajuda - Roadmap Timeline" content={roadmapHelpContent} />
        </div>
      </header>

      {isLoading ? (
        <Card variant="outline" className="p-6">
          <p className="text-text-secondary">Carregando timeline...</p>
        </Card>
      ) : Object.keys(epicosPorProduto).length === 0 ? (
        <Card variant="outline" className="p-6">
          <p className="text-text-secondary">
            Nenhum épico cadastrado para este quarter. Crie épicos para visualizar no roadmap.
          </p>
        </Card>
      ) : (
        <div
          className={cn(
            'space-y-6 transition-all',
            presentationMode &&
              'rounded-lg bg-gradient-to-br from-primary-50 to-secondary-50 p-8 dark:from-primary-950/20 dark:to-secondary-950/20',
          )}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {Object.entries(epicosPorProduto).map(([squadKey, epicos], index) => {
            const featuresDoSquad =
              featuresData?.data?.filter((f) => epicos.some((e) => e.id === f.epicoId)) || []

            return (
              <FadeIn key={squadKey} delay={index * 0.1}>
                <Card
                  variant={presentationMode ? 'elevated' : 'outline'}
                  className={cn('p-6', presentationMode && 'border-2 shadow-xl')}
                >
                  <h2
                    className={cn(
                      'mb-4 font-semibold text-text-primary',
                      presentationMode ? 'text-2xl' : 'text-lg',
                    )}
                  >
                    {squadKey}
                  </h2>
                  <div className="space-y-4">
                    {epicos.map((epico) => {
                      const tier = getCommitmentTier(epico.id)
                      const epicoFeatures = featuresDoSquad.filter((f) => f.epicoId === epico.id)

                      return (
                        <div key={epico.id} className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'rounded-full',
                                presentationMode ? 'h-4 w-4' : 'h-3 w-3',
                                getTierColor(tier),
                              )}
                            />
                            <span
                              className={cn(
                                'font-medium text-text-primary',
                                presentationMode && 'text-lg',
                              )}
                            >
                              {epico.titulo}
                            </span>
                            {tier && (
                              <Badge
                                variant={
                                  tier === 'committed'
                                    ? 'success'
                                    : tier === 'targeted'
                                      ? 'warning'
                                      : 'secondary'
                                }
                                className={cn('text-xs', presentationMode && 'px-3 py-1 text-sm')}
                              >
                                {getTierLabel(tier)}
                              </Badge>
                            )}
                            {!presentationMode && (
                              <Badge variant="outline" className="text-xs">
                                {epico.status}
                              </Badge>
                            )}
                          </div>
                          {epicoFeatures.length > 0 && !presentationMode && (
                            <div className="ml-6 space-y-1">
                              {epicoFeatures.map((feature) => (
                                <div
                                  key={feature.id}
                                  className="flex items-center gap-2 text-sm text-text-secondary"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
                                  <span>{feature.titulo}</span>
                                  {feature.pontos && (
                                    <span className="text-xs text-text-muted">
                                      ({feature.pontos} pts)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </FadeIn>
            )
          })}
        </div>
      )}
    </div>
  )
}
