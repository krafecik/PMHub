import { useMemo, useState } from 'react'
import { Sparkles, ClipboardCopy } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import {
  DiscoveryCompleto,
  gerarResumoExecutivoIa,
  sintetizarEntrevistasIa,
} from '@/lib/discovery-api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

type DiscoveryAssistantProps = {
  discovery: DiscoveryCompleto
  open: boolean
  onOpenChange: (value: boolean) => void
}

type InsightRecommendation = {
  title: string
  description: string
  tone: 'success' | 'info' | 'warning'
}

export function DiscoveryAssistant({ discovery, open, onOpenChange }: DiscoveryAssistantProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [resumoIa, setResumoIa] = useState<string | null>(null)
  const [sinteseIa, setSinteseIa] = useState<string | null>(null)
  const { toast } = useToast()

  const resumoMutation = useMutation({
    mutationFn: () => gerarResumoExecutivoIa(discovery.id),
    onSuccess: (texto) => {
      setResumoIa(texto)
      toast({
        title: 'Resumo executivo gerado',
        description: 'Use como base para comunicar o estado do discovery.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar resumo',
        description: error?.message ?? 'Não foi possível gerar o resumo automaticamente.',
        variant: 'destructive',
      })
    },
  })

  const sintetizarMutation = useMutation({
    mutationFn: () => sintetizarEntrevistasIa(discovery.id),
    onSuccess: (texto) => {
      setSinteseIa(texto)
      toast({
        title: 'Síntese das entrevistas gerada',
        description: 'A IA destacou os principais aprendizados das entrevistas.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao sintetizar entrevistas',
        description: error?.message ?? 'Não foi possível gerar a síntese automaticamente.',
        variant: 'destructive',
      })
    },
  })

  const recommendations = useMemo<InsightRecommendation[]>(() => {
    const hipotesesValidadas = discovery.hipoteses.filter(
      (hipotese) => hipotese.status?.toLowerCase() === 'validada',
    ).length
    const hipotesesRefutadas = discovery.hipoteses.filter(
      (hipotese) => hipotese.status?.toLowerCase() === 'refutada',
    ).length
    const experimentosConcluidos = discovery.experimentos.filter(
      (experimento) => experimento.status?.toLowerCase() === 'concluido',
    )

    const lista: InsightRecommendation[] = [
      {
        title: 'Resumo executivo',
        description: buildExecutiveSummary(discovery, hipotesesValidadas, hipotesesRefutadas),
        tone: 'info',
      },
    ]

    if (experimentosConcluidos.length > 0) {
      const significativos = experimentosConcluidos.filter((exp) => exp.isSignificant).length
      lista.push({
        title: 'Síntese dos experimentos',
        description: `Foram concluídos ${
          experimentosConcluidos.length
        } experimentos, ${significativos} com significância estatística. ${
          significativos > 0
            ? 'Considere priorizar a implementação das melhorias confirmadas e planejar rollout com squads de entrega.'
            : 'Planeje novas iterações ou expandir a amostra antes de uma decisão definitiva.'
        }`,
        tone: significativos > 0 ? 'success' : 'warning',
      })
    }

    if (hipotesesRefutadas > hipotesesValidadas) {
      lista.push({
        title: 'Risco de retrabalho',
        description:
          'Número de hipóteses refutadas supera as validadas. Reavalie a definição de problema e considere ampliar o discovery com novos segmentos de usuário ou dados quantitativos.',
        tone: 'warning',
      })
    }

    if (discovery.decisao) {
      lista.push({
        title: 'Próximos passos sugeridos',
        description:
          'Utilize a decisão registrada para preparar o handoff: alinhe com squads, publique um resumo no decision log e configure métricas de acompanhamento pós-implementação.',
        tone: 'success',
      })
    }

    if (lista.length === 1) {
      lista.push({
        title: 'Explorar próximos aprendizados',
        description:
          'Ainda há espaço para consolidar evidências e insights. Considere entrevistas complementares ou análise de dados quantitativos para fortalecer a confiança na decisão.',
        tone: 'info',
      })
    }

    return lista
  }, [discovery])

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 2000)
    } catch (error) {
      console.error('Erro ao copiar texto', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            Copiloto de Discovery
          </DialogTitle>
          <DialogDescription>
            Sugestões automáticas baseadas nas hipóteses, evidências e experimentos deste discovery.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resumoMutation.mutate()}
            disabled={resumoMutation.isPending}
          >
            {resumoMutation.isPending ? (
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-primary-500" />
            ) : (
              <Sparkles className="text-primary mr-2 h-3 w-3" />
            )}
            Resumo executivo IA
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sintetizarMutation.mutate()}
            disabled={sintetizarMutation.isPending}
          >
            {sintetizarMutation.isPending ? (
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-primary-500" />
            ) : (
              <Sparkles className="text-primary mr-2 h-3 w-3" />
            )}
            Sintetizar entrevistas
          </Button>
        </div>

        <ScrollArea className="max-h-[460px] pr-2">
          <div className="space-y-4">
            {resumoIa && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <Badge variant="info">Resumo executivo IA</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleCopy(resumoIa, -1)}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    {copiedIndex === -1 ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-text-primary">
                  {resumoIa}
                </p>
              </div>
            )}

            {sinteseIa && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <Badge variant="info">Síntese de entrevistas</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleCopy(sinteseIa, -2)}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    {copiedIndex === -2 ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-text-primary">
                  {sinteseIa}
                </p>
              </div>
            )}
          </div>

          <ul className="space-y-4">
            {recommendations.map((item, index) => (
              <li
                key={item.title}
                className="rounded-lg border border-border/70 bg-muted/40 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={toneVariant(item.tone)}>{item.title}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 flex items-center gap-1 text-xs"
                    onClick={() => handleCopy(item.description, index)}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    {copiedIndex === index ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

const toneVariant = (tone: 'success' | 'info' | 'warning' | 'danger') => {
  switch (tone) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'danger':
      return 'destructive'
    case 'info':
      return 'info'
    default:
      return 'outline'
  }
}

const buildExecutiveSummary = (
  discovery: DiscoveryCompleto,
  hipotesesValidadas: number,
  hipotesesRefutadas: number,
) => {
  const totalEntrevistas = discovery.pesquisas.reduce(
    (count, pesquisa) => count + (pesquisa.qtdEntrevistas ?? 0),
    0,
  )

  return [
    `Discovery "${discovery.titulo}" com ${discovery.hipoteses.length} hipóteses analisadas.`,
    hipotesesValidadas > 0
      ? `${hipotesesValidadas} hipótese(s) validada(s) e ${hipotesesRefutadas} refutada(s).`
      : 'Ainda não há hipóteses validadas; foque em consolidar evidências adicionais.',
    discovery.experimentos.length > 0
      ? `${discovery.experimentos.length} experimento(s) executado(s) com ${discovery.experimentos.filter((exp) => exp.hasResults).length} resultados registrados.`
      : 'Nenhum experimento executado até o momento.',
    totalEntrevistas > 0
      ? `${totalEntrevistas} entrevista(s) conduzida(s) em ${discovery.pesquisas.length} pesquisa(s).`
      : 'Planeje pesquisas qualitativas para aprofundar o entendimento do problema.',
  ].join(' ')
}
