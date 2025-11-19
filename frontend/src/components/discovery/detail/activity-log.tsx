import { useMemo, useState } from 'react'
import { Activity, Beaker, Lightbulb, Rocket } from 'lucide-react'

import { DiscoveryCompleto } from '@/lib/discovery-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type ActivityLogProps = {
  discovery: DiscoveryCompleto
}

const EVENT_LABELS: Record<
  string,
  {
    label: string
    icon: React.ReactNode
    tone: 'default' | 'info' | 'success' | 'warning' | 'danger'
  }
> = {
  discovery_criado: {
    label: 'Discovery criado',
    icon: <Rocket className="h-4 w-4" />,
    tone: 'success',
  },
  hipotese_criada: {
    label: 'Hipótese criada',
    icon: <Lightbulb className="h-4 w-4" />,
    tone: 'info',
  },
  hipotese_validada: {
    label: 'Hipótese validada',
    icon: <Lightbulb className="h-4 w-4" />,
    tone: 'success',
  },
  hipotese_refutada: {
    label: 'Hipótese refutada',
    icon: <Lightbulb className="h-4 w-4" />,
    tone: 'warning',
  },
  insight_gerado: {
    label: 'Insight gerado',
    icon: <Lightbulb className="h-4 w-4" />,
    tone: 'info',
  },
  experimento_iniciado: {
    label: 'Experimento iniciado',
    icon: <Beaker className="h-4 w-4" />,
    tone: 'info',
  },
  experimento_concluido: {
    label: 'Experimento concluído',
    icon: <Beaker className="h-4 w-4" />,
    tone: 'success',
  },
  discovery_finalizado: {
    label: 'Discovery finalizado',
    icon: <Rocket className="h-4 w-4" />,
    tone: 'success',
  },
  status_atualizado: {
    label: 'Status atualizado',
    icon: <Activity className="h-4 w-4" />,
    tone: 'default',
  },
  contexto_atualizado: {
    label: 'Contexto atualizado',
    icon: <Activity className="h-4 w-4" />,
    tone: 'default',
  },
  origem_identificacao_atualizada: {
    label: 'Origem de identificação atualizada',
    icon: <Activity className="h-4 w-4" />,
    tone: 'default',
  },
  publico_afetado_atualizado: {
    label: 'Público afetado atualizado',
    icon: <Activity className="h-4 w-4" />,
    tone: 'default',
  },
  volume_impactado_atualizado: {
    label: 'Volume impactado atualizado',
    icon: <Activity className="h-4 w-4" />,
    tone: 'default',
  },
  decisao_parcial_atualizada: {
    label: 'Decisão parcial registrada',
    icon: <Activity className="h-4 w-4" />,
    tone: 'info',
  },
}

export function DiscoveryActivityLog({ discovery }: ActivityLogProps) {
  const entries = useMemo(() => discovery.evolucaoLog ?? [], [discovery.evolucaoLog])
  const [typeFilter, setTypeFilter] = useState('all')

  const typeOptions = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.tipo))
    return Array.from(unique)
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (typeFilter === 'all') return entries
    return entries.filter((entry) => entry.tipo === typeFilter)
  }, [entries, typeFilter])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Linha do tempo</CardTitle>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Filtrar evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {typeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {EVENT_LABELS[option]?.label ?? option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhe automaticamente as principais ações do discovery, como criação de hipóteses,
          geração de insights e experimentos concluídos.
        </p>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            As atividades do discovery serão registradas conforme o trabalho evolui.
          </p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento encontrado para o filtro.</p>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <ul className="space-y-3 text-sm">
              {filteredEntries.map((item, index) => {
                const metadata = EVENT_LABELS[item.tipo] ?? EVENT_LABELS.status_atualizado
                return (
                  <li
                    key={`${item.tipo}-${index}-${item.timestamp}`}
                    className="flex gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border',
                        metadata.tone === 'success' && 'border-green-500/50 text-green-600',
                        metadata.tone === 'info' && 'border-primary/40 text-primary',
                        metadata.tone === 'warning' && 'border-amber-500/50 text-amber-600',
                        metadata.tone === 'danger' && 'border-red-500/50 text-red-600',
                        metadata.tone === 'default' &&
                          'border-muted-foreground/40 text-muted-foreground',
                      )}
                    >
                      {metadata.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text-primary">{metadata.label}</p>
                        <Badge variant="outline">
                          {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </Badge>
                      </div>
                      {renderEventDetails(item.tipo, item.dados)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

const renderEventDetails = (tipo: string, dados: Record<string, unknown> | undefined) => {
  if (!dados || Object.keys(dados).length === 0) {
    return <p className="text-xs text-muted-foreground">Sem detalhes adicionais.</p>
  }

  const getString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined

  switch (tipo) {
    case 'hipotese_validada':
    case 'hipotese_criada':
    case 'hipotese_refutada': {
      const titulo = getString(dados.titulo)
      const impacto = getString(dados.impacto)
      return (
        <div className="text-xs text-muted-foreground">
          {titulo && <p className="font-semibold">{titulo}</p>}
          {impacto && <p>Impacto: {impacto}</p>}
        </div>
      )
    }
    case 'insight_gerado': {
      const descricao = getString(dados.descricao)
      const impactoInsight = getString(dados.impacto)
      const confianca = getString(dados.confianca)
      return (
        <div className="text-xs text-muted-foreground">
          {descricao && <p>{descricao}</p>}
          {impactoInsight && confianca && (
            <p>
              Impacto: {impactoInsight} · Confiança: {confianca}
            </p>
          )}
        </div>
      )
    }
    case 'experimento_concluido': {
      const tituloExperimento = getString(dados.titulo)
      const resultado = getString(dados.resultado)
      const pValue =
        typeof dados.pValue === 'string' || typeof dados.pValue === 'number'
          ? dados.pValue
          : undefined
      return (
        <div className="text-xs text-muted-foreground">
          {tituloExperimento && <p>{tituloExperimento}</p>}
          {resultado && <p>Resultado: {resultado}</p>}
          {pValue !== undefined && <p>p-value: {pValue}</p>}
        </div>
      )
    }
    default:
      return <pre className="text-xs text-muted-foreground">{JSON.stringify(dados, null, 2)}</pre>
  }
}
