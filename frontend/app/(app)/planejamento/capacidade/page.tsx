'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { HelpButton } from '@/components/ui/help-button'
import { fetchCapacidade, listarFeatures, listarEpicos } from '@/lib/planejamento-api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FadeIn } from '@/components/motion'
import { cn } from '@/lib/utils'

const capacidadeHelpContent = (
  <div className="space-y-4">
    <p>
      Visualize e gerencie a capacidade de cada squad para o quarter selecionado. Monitore a
      utilização e garanta que não ultrapasse 110%.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Informações:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>Capacidade total do squad</li>
        <li>Pontos alocados</li>
        <li>Capacidade disponível</li>
        <li>Percentual de utilização</li>
      </ul>
    </div>
  </div>
)

export default function CapacidadePage() {
  const [quarter, setQuarter] = useState('Q1 2026')

  const { data, isLoading } = useQuery({
    queryKey: ['capacidade', quarter],
    queryFn: () => fetchCapacidade(quarter),
  })

  const { data: featuresData } = useQuery({
    queryKey: ['features', quarter],
    queryFn: () => listarFeatures({ quarter }),
  })

  const { data: epicosData } = useQuery({
    queryKey: ['epicos', quarter],
    queryFn: () => listarEpicos({ quarter }),
  })

  // Agrupar features por squad e épico
  const featuresPorSquad =
    featuresData?.data?.reduce((acc: Record<string, any[]>, feature) => {
      const squadId = feature.squadId || 'Sem Squad'
      if (!acc[squadId]) acc[squadId] = []
      acc[squadId].push(feature)
      return acc
    }, {}) || {}

  const epicosPorId =
    epicosData?.data?.reduce((acc: Record<string, any>, epico) => {
      acc[epico.id] = epico
      return acc
    }, {}) || {}

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Capacidade por Squad</h1>
          <p className="text-text-secondary">Ajuste buffers e garanta utilização abaixo de 110%.</p>
        </div>
        <div className="flex items-center gap-2">
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
          <HelpButton title="Ajuda - Capacidade" content={capacidadeHelpContent} />
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} variant="outline" className="p-6">
              <div className="h-32 animate-pulse rounded bg-secondary-200 dark:bg-secondary-800" />
            </Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card variant="outline" className="p-6">
          <p className="text-text-secondary">Nenhuma capacidade cadastrada para este quarter.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((squad, index) => {
            const utilizacao =
              squad.capacidadeTotal > 0 ? (squad.capacidadeUsada / squad.capacidadeTotal) * 100 : 0
            const disponivel = squad.capacidadeTotal - squad.capacidadeUsada

            return (
              <FadeIn key={squad.squadId} delay={index * 0.1}>
                <Card variant="outline" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-text-primary">
                        Squad {squad.squadId}
                      </h3>
                      <p className="text-sm text-text-muted">
                        Capacidade {squad.capacidadeTotal} pts
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Alocado</span>
                        <span className="font-medium text-text-primary">
                          {squad.capacidadeUsada} pts
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Disponível</span>
                        <span className="font-medium text-text-primary">{disponivel} pts</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Utilização</span>
                        <span
                          className={cn(
                            'font-medium',
                            utilizacao > 110
                              ? 'text-rose-600'
                              : utilizacao > 95
                                ? 'text-amber-600'
                                : 'text-emerald-600',
                          )}
                        >
                          {utilizacao.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={Math.min(utilizacao, 100)}
                      className={cn(
                        'h-3',
                        utilizacao > 110 && 'bg-rose-500',
                        utilizacao > 95 && utilizacao <= 110 && 'bg-amber-500',
                      )}
                    />

                    {utilizacao > 110 && (
                      <p className="text-xs text-rose-600">
                        ⚠ Capacidade excedida! Ajuste necessário.
                      </p>
                    )}

                    {/* Features por quarter */}
                    {featuresPorSquad[squad.squadId] &&
                      featuresPorSquad[squad.squadId].length > 0 && (
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="mb-2 text-xs uppercase text-text-muted">
                            Features por quarter:
                          </p>
                          <div className="space-y-1">
                            {Object.entries(
                              featuresPorSquad[squad.squadId].reduce(
                                (acc: Record<string, number>, feature) => {
                                  const epicoNome =
                                    epicosPorId[feature.epicoId]?.titulo || 'Sem épico'
                                  if (!acc[epicoNome]) acc[epicoNome] = 0
                                  acc[epicoNome] += feature.pontos || 0
                                  return acc
                                },
                                {},
                              ),
                            ).map(([epicoNome, pontos]) => (
                              <div
                                key={epicoNome}
                                className="flex items-center justify-between text-sm text-text-secondary"
                              >
                                <span>• {epicoNome}</span>
                                <span className="font-medium">{pontos} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
