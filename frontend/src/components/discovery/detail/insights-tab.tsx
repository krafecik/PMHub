import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lightbulb, Filter, Sparkles } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import {
  DiscoveryCompleto,
  correlacionarInsightsIa,
  type InsightCorrelacaoIa,
} from '@/lib/discovery-api'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { useGerarInsight } from '@/hooks/use-discovery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useDiscoverySearch } from '@/components/discovery/detail/search-context'
import { FadeIn } from '@/components/motion/fade-in'
import { useToast } from '@/hooks/use-toast'

type InsightsTabProps = {
  discovery: DiscoveryCompleto
}

const insightSchema = z.object({
  descricao: z.string().min(10, 'Descreva o insight com mais detalhes'),
  impacto: z.string().min(1, 'Selecione o impacto'),
  confianca: z.string().min(1, 'Selecione a confiança'),
  tags: z.string().optional(),
  entrevistaId: z.string().optional(),
})

type InsightFormValues = z.infer<typeof insightSchema>

export function DiscoveryInsightsTab({ discovery }: InsightsTabProps) {
  const { globalSearchTerm } = useDiscoverySearch()
  const [impactoFilter, setImpactoFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [correlacoesIa, setCorrelacoesIa] = useState<Record<string, InsightCorrelacaoIa[]>>({})
  const [loadingInsightId, setLoadingInsightId] = useState<string | null>(null)

  const impactoCatalog = useCatalogItemsBySlug('impacto_insight', { includeInativos: false })
  const confiancaCatalog = useCatalogItemsBySlug('confianca_insight', { includeInativos: false })
  const statusCatalog = useCatalogItemsBySlug('status_insight', { includeInativos: false })

  const gerarInsight = useGerarInsight(discovery.id)
  const { toast } = useToast()

  const form = useForm<InsightFormValues>({
    resolver: zodResolver(insightSchema),
    defaultValues: {
      descricao: '',
      impacto: impactoCatalog.data?.itens?.[0]?.slug ?? '',
      confianca: confiancaCatalog.data?.itens?.[0]?.slug ?? '',
      tags: '',
      entrevistaId: '',
    },
  })

  const filteredInsights = useMemo(() => {
    return discovery.insights.filter((insight) => {
      const matchesImpacto =
        impactoFilter === 'all' || insight.impacto.toLowerCase() === impactoFilter.toLowerCase()
      const matchesStatus =
        statusFilter === 'all' || insight.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesLocal = matchesInsightSearch(insight, searchTerm)
      const matchesGlobal = matchesInsightSearch(insight, globalSearchTerm)

      return matchesImpacto && matchesStatus && matchesLocal && matchesGlobal
    })
  }, [discovery.insights, impactoFilter, statusFilter, searchTerm, globalSearchTerm])

  const handleCreateInsight = (values: InsightFormValues) => {
    gerarInsight.mutate(
      {
        descricao: values.descricao,
        impacto: values.impacto,
        confianca: values.confianca,
        tags: splitToArray(values.tags),
        entrevistaId: values.entrevistaId ? values.entrevistaId : undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          form.reset({
            descricao: '',
            impacto: impactoCatalog.data?.itens?.[0]?.slug ?? '',
            confianca: confiancaCatalog.data?.itens?.[0]?.slug ?? '',
            tags: '',
            entrevistaId: '',
          })
        },
      },
    )
  }

  const correlacionarMutation = useMutation({
    mutationFn: (insightId: string) => correlacionarInsightsIa(discovery.id, insightId),
    onMutate: (insightId) => {
      setLoadingInsightId(insightId)
    },
    onSuccess: (resultado, insightId) => {
      setCorrelacoesIa((prev) => ({ ...prev, [insightId]: resultado ?? [] }))
      toast({
        title: 'Análise concluída',
        description:
          resultado && resultado.length > 0
            ? 'A IA correlacionou este insight com outros do discovery.'
            : 'Nenhuma correlação relevante encontrada.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao correlacionar insights',
        description: error?.message ?? 'Não foi possível gerar correlações automaticamente.',
        variant: 'destructive',
      })
    },
    onSettled: () => setLoadingInsightId(null),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Insights ({discovery.insights.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Agrupe os aprendizados de pesquisas e evidências para embasar decisões estratégicas.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Novo insight
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar insight</DialogTitle>
              <DialogDescription>
                Converta descobertas qualitativas em insights acionáveis e conecte-os às hipóteses.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateInsight)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          minRows={4}
                          placeholder="Ex.: Usuários interpretam o passo 3 como opcional e pulam sem perceber."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="impacto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impacto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o impacto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {impactoCatalog.data?.itens?.map((item) => (
                              <SelectItem key={item.id} value={item.slug}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confianca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confiança</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a confiança" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {confiancaCatalog.data?.itens?.map((item) => (
                              <SelectItem key={item.id} value={item.slug}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="entrevistaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrevista (ID opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Associe ao identificador de uma entrevista"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Separe por vírgula" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={gerarInsight.isPending}>
                    {gerarInsight.isPending ? 'Gerando...' : 'Registrar insight'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={impactoFilter} onValueChange={setImpactoFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Impacto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os impactos</SelectItem>
              {impactoCatalog.data?.itens?.map((item) => (
                <SelectItem key={item.id} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusCatalog.data?.itens?.map((item) => (
                <SelectItem key={item.id} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 items-center gap-2 sm:max-w-[260px]">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar insight"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {filteredInsights.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum insight encontrado. Gere aprendizados a partir das pesquisas e evidências para
            orientar a priorização.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredInsights.map((insight, index) => (
            <FadeIn key={insight.id} delay={index * 0.05}>
              <Card className="border-border/80">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{insight.impactoLabel}</Badge>
                    <Badge variant="outline">{insight.confiancaLabel}</Badge>
                    <Badge variant="outline">{insight.statusLabel}</Badge>
                  </div>
                  <CardTitle className="text-base font-semibold text-text-primary">
                    {insight.descricao}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Criado em {new Date(insight.createdAt).toLocaleString('pt-BR')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  {insight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.tags.map((tag) => (
                        <Badge key={`${insight.id}-${tag}`} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p>
                    Evidências relacionadas: <strong>{insight.qtdEvidencias}</strong>
                  </p>
                  <p>Relevância calculada: {Math.round(insight.relevanceScore * 100) / 100}</p>

                  <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Analisar correlações
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-xs"
                        onClick={() => correlacionarMutation.mutate(insight.id)}
                        disabled={loadingInsightId === insight.id}
                      >
                        {loadingInsightId === insight.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-500" />
                        ) : (
                          <Sparkles className="text-primary h-3.5 w-3.5" />
                        )}
                        {correlacoesIa[insight.id] ? 'Regerar' : 'Analisar com IA'}
                      </Button>
                    </div>
                    {correlacoesIa[insight.id] && correlacoesIa[insight.id].length > 0 && (
                      <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                        {correlacoesIa[insight.id].map((correlacao) => (
                          <li
                            key={correlacao.id}
                            className="rounded-md border border-border/60 bg-background/50 p-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-text-primary">
                                #{correlacao.id}
                              </span>
                              <Badge variant="success">
                                {Math.round(correlacao.grauCorrelacao)}%
                              </Badge>
                            </div>
                            <p className="mt-1 leading-relaxed">{correlacao.comentario}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {correlacoesIa[insight.id] && correlacoesIa[insight.id].length === 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        A IA não encontrou correlações relevantes com outros insights por enquanto.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}

const splitToArray = (value?: string): string[] | undefined => {
  if (!value) return undefined
  const tokens = value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
  return tokens.length > 0 ? tokens : undefined
}

const matchesInsightSearch = (insight: DiscoveryCompleto['insights'][number], term: string) => {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return true
  return (
    insight.descricao.toLowerCase().includes(normalized) ||
    insight.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
    insight.statusLabel?.toLowerCase().includes(normalized)
  )
}
