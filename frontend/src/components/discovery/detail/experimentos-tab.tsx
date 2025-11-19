import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { DiscoveryCompleto, sugerirMvpIa, type MvpIaSugestao } from '@/lib/discovery-api'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { useIniciarExperimento, useConcluirExperimento } from '@/hooks/use-discovery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Sparkles } from 'lucide-react'
import { useDiscoverySearch } from '@/components/discovery/detail/search-context'
import { experimentoTemplates } from '@/components/discovery/detail/templates'
import { FadeIn } from '@/components/motion/fade-in'

type ExperimentosTabProps = {
  discovery: DiscoveryCompleto
}

const iniciarExperimentoSchema = z.object({
  titulo: z.string().min(3, 'Informe um título'),
  descricao: z.string().min(10, 'Descreva o experimento'),
  tipo: z.string().min(1, 'Selecione o tipo'),
  metricaSucesso: z.string().min(3, 'Indique a métrica de sucesso'),
  hipoteseId: z.string().optional(),
  grupoControle: z.string().optional(),
  grupoVariante: z.string().optional(),
})

const concluirExperimentoSchema = z.object({
  resultados: z.string().min(2, 'Informe o resumo dos resultados (JSON)'),
  pValue: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() !== '' ? Number(value) : undefined))
    .refine(
      (value) => value === undefined || (!Number.isNaN(value) && value >= 0 && value <= 1),
      'p-value deve estar entre 0 e 1',
    ),
})

type IniciarExperimentoFormValues = z.infer<typeof iniciarExperimentoSchema>
type ConcluirExperimentoFormValues = z.infer<typeof concluirExperimentoSchema>

export function DiscoveryExperimentosTab({ discovery }: ExperimentosTabProps) {
  const { globalSearchTerm } = useDiscoverySearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [concluirDialogOpen, setConcluirDialogOpen] = useState(false)
  const [selectedExperimentoId, setSelectedExperimentoId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('none')
  const [mvpSugestoes, setMvpSugestoes] = useState<MvpIaSugestao[]>([])

  const tipoCatalog = useCatalogItemsBySlug('tipo_experimento', { includeInativos: false })
  const statusCatalog = useCatalogItemsBySlug('status_experimento', { includeInativos: false })

  const iniciarExperimento = useIniciarExperimento(discovery.id)
  const concluirExperimento = useConcluirExperimento()

  const iniciarForm = useForm<IniciarExperimentoFormValues>({
    resolver: zodResolver(iniciarExperimentoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: tipoCatalog.data?.itens?.[0]?.slug ?? '',
      metricaSucesso: '',
      hipoteseId: '',
      grupoControle: '',
      grupoVariante: '',
    },
  })

  const concluirForm = useForm<ConcluirExperimentoFormValues>({
    resolver: zodResolver(concluirExperimentoSchema),
    defaultValues: {
      resultados: '',
      pValue: undefined,
    },
  })

  const tipoLookup = useMemo(() => {
    const map = new Map<string, string>()
    tipoCatalog.data?.itens?.forEach((item) => map.set(item.slug, item.label))
    return map
  }, [tipoCatalog.data?.itens])

  const hipoteseLookup = useMemo(() => {
    const map = new Map<string, string>()
    discovery.hipoteses.forEach((hipotese) => map.set(hipotese.id, hipotese.titulo))
    return map
  }, [discovery.hipoteses])

  const filteredExperimentos = useMemo(() => {
    return discovery.experimentos.filter((experimento) => {
      const matchesStatus =
        statusFilter === 'all' || experimento.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesTipo =
        typeFilter === 'all' || experimento.tipo.toLowerCase() === typeFilter.toLowerCase()
      const tipoLabel = tipoLookup.get(experimento.tipo) ?? experimento.tipo
      const matchesSearch =
        !globalSearchTerm || experimentMatchesSearch(experimento, tipoLabel, globalSearchTerm)
      return matchesStatus && matchesTipo && matchesSearch
    })
  }, [discovery.experimentos, statusFilter, typeFilter, globalSearchTerm, tipoLookup])

  const handleCreateExperimento = (values: IniciarExperimentoFormValues) => {
    iniciarExperimento.mutate(
      {
        titulo: values.titulo,
        descricao: values.descricao,
        tipo: values.tipo,
        metricaSucesso: values.metricaSucesso,
        hipoteseId: values.hipoteseId || undefined,
        grupoControle: parseJson(values.grupoControle),
        grupoVariante: parseJson(values.grupoVariante),
      },
      {
        onSuccess: () => {
          iniciarForm.reset({
            titulo: '',
            descricao: '',
            tipo: tipoCatalog.data?.itens?.[0]?.slug ?? '',
            metricaSucesso: '',
            hipoteseId: '',
            grupoControle: '',
            grupoVariante: '',
          })
          setCreateDialogOpen(false)
          setSelectedTemplate('none')
        },
      },
    )
  }

  const handleConcluirExperimento = (values: ConcluirExperimentoFormValues) => {
    if (!selectedExperimentoId) return

    concluirExperimento.mutate(
      {
        experimentoId: selectedExperimentoId,
        resultados: parseJson(values.resultados),
        pValue: values.pValue ?? undefined,
      },
      {
        onSuccess: () => {
          setConcluirDialogOpen(false)
          setSelectedExperimentoId(null)
          concluirForm.reset({ resultados: '', pValue: undefined })
        },
      },
    )
  }

  const statusOptions =
    statusCatalog.data?.itens?.map((item) => ({
      value: item.slug,
      label: item.label,
    })) ?? []

  const gerarMvpMutation = useMutation({
    mutationFn: () => sugerirMvpIa(discovery.id),
    onSuccess: (resultado) => {
      setMvpSugestoes(resultado ?? [])
      toast('Sugestões de MVP geradas', {
        description:
          resultado && resultado.length > 0
            ? 'A IA propôs experimentos para validar suas hipóteses.'
            : 'Nenhuma sugestão criada neste momento. Revise os dados e tente novamente.',
      })
    },
    onError: (error: any) => {
      toast('Erro ao gerar MVPs', {
        description: error?.message ?? 'Não foi possível gerar sugestões automaticamente.',
      })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Experimentos ({discovery.experimentos.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Conduza MVPs e testes controlados para validar hipóteses com dados quantitativos.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => gerarMvpMutation.mutate()}
            disabled={gerarMvpMutation.isPending}
          >
            {gerarMvpMutation.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-500" />
            ) : (
              <Sparkles className="text-primary h-4 w-4" />
            )}
            {mvpSugestoes.length > 0 ? 'Regerar sugestões IA' : 'Sugerir MVPs com IA'}
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Iniciar experimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo experimento</DialogTitle>
                <DialogDescription>
                  Matriz de aprendizado para validar hipóteses antes de escalar a solução.
                </DialogDescription>
              </DialogHeader>
              <Form {...iniciarForm}>
                <form
                  onSubmit={iniciarForm.handleSubmit(handleCreateExperimento)}
                  className="space-y-4"
                >
                  <FormItem>
                    <FormLabel>Aplicar template</FormLabel>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        setSelectedTemplate(value)
                        if (value === 'none') return
                        const template = experimentoTemplates.find((item) => item.label === value)
                        if (template) {
                          iniciarForm.reset({
                            titulo: template.values.titulo,
                            descricao: template.values.descricao,
                            tipo: template.values.tipo,
                            metricaSucesso: template.values.metricaSucesso,
                            hipoteseId: '',
                            grupoControle: template.values.grupoControle,
                            grupoVariante: template.values.grupoVariante,
                          })
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem template</SelectItem>
                        {experimentoTemplates.map((template) => (
                          <SelectItem key={template.label} value={template.label}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <FormField
                    control={iniciarForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Botão fixo na etapa 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iniciarForm.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={4}
                            placeholder="Explique o que será testado e os passos do experimento"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={iniciarForm.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tipoCatalog.data?.itens?.map((item) => (
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
                      control={iniciarForm.control}
                      name="metricaSucesso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Métrica de sucesso</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex.: +15% na taxa de conclusão" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={iniciarForm.control}
                    name="hipoteseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hipótese relacionada (opcional)</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? undefined : value)
                          }
                          value={field.value ?? 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione hipótese" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem vínculo</SelectItem>
                            {discovery.hipoteses.map((hipotese) => (
                              <SelectItem key={hipotese.id} value={hipotese.id}>
                                {hipotese.titulo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iniciarForm.control}
                    name="grupoControle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo controle (JSON opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={3}
                            placeholder='Ex.: {"usuarios": 135, "taxa": 0.32}'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={iniciarForm.control}
                    name="grupoVariante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo variante (JSON opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={3}
                            placeholder='Ex.: {"usuarios": 140, "taxa": 0.48}'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={iniciarExperimento.isPending}>
                      {iniciarExperimento.isPending ? 'Iniciando...' : 'Iniciar experimento'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tipo de experimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {tipoCatalog.data?.itens?.map((item) => (
                <SelectItem key={item.id} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mvpSugestoes.length > 0 && (
        <Card className="border-primary-200/70 bg-primary-50/60 dark:border-primary-900/40 dark:bg-primary-950/30">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-primary-900 dark:text-primary-100">
                  Sugestões de MVP da IA
                </CardTitle>
                <p className="text-sm text-primary-800/80 dark:text-primary-200">
                  Utilize como ponto de partida para experimentar ideias com menor risco.
                </p>
              </div>
              <Badge variant="info">IA Assist</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {mvpSugestoes.map((mvp, index) => (
              <div
                key={`${mvp.nome}-${index}`}
                className="rounded-lg border border-primary-200/60 bg-white/80 p-4 dark:border-primary-800/50 dark:bg-primary-950/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-primary-900 dark:text-primary-100">
                      {mvp.nome}
                    </h4>
                    <p className="mt-1 text-sm text-primary-800 dark:text-primary-100/90">
                      {mvp.descricao}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs uppercase tracking-wide">
                    {mvp.metricas[0] ?? 'Métrica não definida'}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-primary-700 dark:text-primary-200">
                  {mvp.hipotesesAlvo.length > 0 && (
                    <div>
                      <p className="font-semibold uppercase tracking-wide">Hipóteses alvo</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {mvp.hipotesesAlvo.map((hipotese) => (
                          <li key={hipotese}>{hipotese}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {mvp.metricas.length > 0 && (
                    <div>
                      <p className="font-semibold uppercase tracking-wide">Métricas sugeridas</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {mvp.metricas.map((metrica) => (
                          <li key={metrica}>{metrica}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {filteredExperimentos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum experimento registrado. Utilize o botão acima para iniciar um teste controlado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExperimentos.map((experimento, index) => {
            const tipoLabel = tipoLookup.get(experimento.tipo) ?? experimento.tipo
            const hipoteseTitulo = experimento.hipoteseId
              ? hipoteseLookup.get(experimento.hipoteseId)
              : undefined
            const hasResults = experimento.hasResults

            return (
              <FadeIn key={experimento.id} delay={index * 0.05}>
                <Card className="border-border/80">
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{tipoLabel}</Badge>
                      <Badge variant={statusBadgeVariant(experimento.status)}>
                        {experimento.statusLabel}
                      </Badge>
                      <Badge variant="outline">
                        {new Date(experimento.createdAt).toLocaleDateString('pt-BR')}
                      </Badge>
                      {experimento.isSignificant && (
                        <Badge variant="success">p-value significativo</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-semibold text-text-primary">
                      {experimento.titulo}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {experimento.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      Métrica de sucesso: <strong>{experimento.metricaSucesso}</strong>
                    </p>
                    {hipoteseTitulo && (
                      <p>
                        Hipótese associada: <strong>{hipoteseTitulo}</strong>
                      </p>
                    )}

                    {hasResults ? (
                      <div className="rounded-lg border border-border bg-muted/40 p-4">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                          Resultados
                        </h4>
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                          {JSON.stringify(experimento.resultados, null, 2)}
                        </pre>
                        {experimento.pValue !== undefined && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            p-value: <strong>{experimento.pValue}</strong>
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedExperimentoId(experimento.id)
                          setConcluirDialogOpen(true)
                        }}
                      >
                        Registrar resultados
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            )
          })}
        </div>
      )}

      <Dialog open={concluirDialogOpen} onOpenChange={setConcluirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar resultados</DialogTitle>
            <DialogDescription>
              Cole os resultados do experimento em formato JSON e informe o p-value, se aplicável.
            </DialogDescription>
          </DialogHeader>
          <Form {...concluirForm}>
            <form
              onSubmit={concluirForm.handleSubmit(handleConcluirExperimento)}
              className="space-y-4"
            >
              <FormField
                control={concluirForm.control}
                name="resultados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultados (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        minRows={6}
                        placeholder='{"controle": {...}, "variante": {...}}'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={concluirForm.control}
                name="pValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>p-value (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: 0.04" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={concluirExperimento.isPending}>
                  {concluirExperimento.isPending ? 'Registrando...' : 'Concluir experimento'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const parseJson = (value?: string) => {
  if (!value) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const statusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'concluido':
      return 'success'
    case 'em_execucao':
    case 'em execução':
      return 'info'
    case 'cancelado':
      return 'destructive'
    default:
      return 'outline'
  }
}

const experimentMatchesSearch = (
  experimento: DiscoveryCompleto['experimentos'][number],
  tipoLabel: string,
  term: string,
) => {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return true
  return (
    experimento.titulo.toLowerCase().includes(normalized) ||
    experimento.descricao.toLowerCase().includes(normalized) ||
    experimento.metricaSucesso.toLowerCase().includes(normalized) ||
    tipoLabel.toLowerCase().includes(normalized) ||
    experimento.statusLabel.toLowerCase().includes(normalized)
  )
}
