import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'

import { DiscoveryCompleto, STATUS_HIPOTESE_DEFAULTS } from '@/lib/discovery-api'
import { sugerirHipotesesIa, type HipoteseIaSugestao } from '@/lib/discovery-api'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { useAtualizarStatusHipotese, useCriarHipotese } from '@/hooks/use-discovery'
import { hipotesesTemplates } from '@/components/discovery/detail/templates'
import { useDiscoverySearch } from '@/components/discovery/detail/search-context'
import { FadeIn } from '@/components/motion/fade-in'
import { Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type HipotesesTabProps = {
  discovery: DiscoveryCompleto
}

const createHipoteseSchema = z.object({
  titulo: z.string().min(3, 'Informe um título com pelo menos 3 caracteres').max(200),
  descricao: z.string().min(10, 'Descreva a hipótese com mais detalhes'),
  comoValidar: z.string().min(5, 'Explique como validar a hipótese'),
  metricaAlvo: z.string().optional(),
  impactoEsperado: z.string().optional(),
  prioridade: z.string().optional(),
})

type HipoteseFormValues = z.infer<typeof createHipoteseSchema>

export function DiscoveryHipotesesTab({ discovery }: HipotesesTabProps) {
  const { globalSearchTerm } = useDiscoverySearch()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none')
  const [iaSugestoes, setIaSugestoes] = useState<HipoteseIaSugestao[]>([])

  const criarHipotese = useCriarHipotese(discovery.id)
  const atualizarStatus = useAtualizarStatusHipotese()
  const { toast } = useToast()

  const impactoCatalog = useCatalogItemsBySlug('impacto_hipotese', { includeInativos: false })
  const prioridadeCatalog = useCatalogItemsBySlug('prioridade_hipotese', { includeInativos: false })
  const statusCatalog = useCatalogItemsBySlug('status_hipotese', { includeInativos: false })

  const form = useForm<HipoteseFormValues>({
    resolver: zodResolver(createHipoteseSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      comoValidar: '',
      metricaAlvo: '',
      impactoEsperado: impactoCatalog.data?.itens?.[0]?.slug ?? '',
      prioridade: prioridadeCatalog.data?.itens?.[0]?.slug ?? '',
    },
  })

  const filteredHipoteses = useMemo(() => {
    const collection =
      statusFilter === 'all'
        ? discovery.hipoteses
        : discovery.hipoteses.filter(
            (hipotese) => hipotese.status?.toLowerCase() === statusFilter.toLowerCase(),
          )
    if (!globalSearchTerm) return collection
    return collection.filter((hipotese) => matchesSearch(hipotese, globalSearchTerm))
  }, [discovery.hipoteses, statusFilter, globalSearchTerm])

  const onSubmit = (values: HipoteseFormValues) => {
    criarHipotese.mutate(values, {
      onSuccess: () => {
        form.reset({
          titulo: '',
          descricao: '',
          comoValidar: '',
          metricaAlvo: '',
          impactoEsperado: impactoCatalog.data?.itens?.[0]?.slug ?? '',
          prioridade: prioridadeCatalog.data?.itens?.[0]?.slug ?? '',
        })
        setDialogOpen(false)
        setSelectedTemplate('none')
      },
    })
  }

  const gerarHipotesesIa = useMutation({
    mutationFn: () => sugerirHipotesesIa(discovery.id),
    onSuccess: (resultado) => {
      setIaSugestoes(resultado ?? [])
      toast({
        title: 'Sugestões geradas',
        description:
          resultado && resultado.length > 0
            ? 'A IA sugeriu hipóteses com base nos insights coletados.'
            : 'Nenhuma hipótese sugerida pela IA neste momento.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar sugestões',
        description: error?.message ?? 'Não foi possível gerar hipóteses automaticamente.',
        variant: 'destructive',
      })
    },
  })

  const statusOptions =
    statusCatalog.data?.itens?.map((item) => ({
      value: item.slug,
      label: item.label,
    })) ??
    STATUS_HIPOTESE_DEFAULTS.map((status) => ({
      value: status,
      label: status.toLowerCase(),
    }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Hipóteses ({discovery.hipoteses.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Formule, teste e atualize hipóteses que expliquem o problema em investigação.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => gerarHipotesesIa.mutate()}
            disabled={gerarHipotesesIa.isPending}
          >
            {gerarHipotesesIa.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-500" />
            ) : (
              <Sparkles className="text-primary h-4 w-4" />
            )}
            {iaSugestoes.length > 0 ? 'Regerar com IA' : 'Gerar hipóteses IA'}
          </Button>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar status" />
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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Nova hipótese</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar nova hipótese</DialogTitle>
                <DialogDescription>
                  Hipóteses fortes são específicas, mensuráveis e conectadas ao problema
                  investigado.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormItem>
                    <FormLabel>Aplicar template</FormLabel>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        setSelectedTemplate(value)
                        if (value === 'none') return
                        const template = hipotesesTemplates.find((item) => item.label === value)
                        if (template) {
                          form.reset({
                            titulo: template.values.titulo,
                            descricao: template.values.descricao,
                            comoValidar: template.values.comoValidar,
                            metricaAlvo: template.values.metricaAlvo,
                            impactoEsperado: template.values.impactoEsperado,
                            prioridade: template.values.prioridade,
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
                        {hipotesesTemplates.map((template) => (
                          <SelectItem key={template.label} value={template.label}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex.: Usuários não percebem o botão avançar"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={3}
                            placeholder="Descreva o raciocínio da hipótese e o porquê ela pode ser verdadeira."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comoValidar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Como validar</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={3}
                            placeholder="Explique rapidamente qual método será usado para validar."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metricaAlvo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Métrica alvo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: +15% na taxa de conclusão" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="impactoEsperado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impacto esperado</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                      name="prioridade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {prioridadeCatalog.data?.itens?.map((item) => (
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

                  <DialogFooter>
                    <Button type="submit" disabled={criarHipotese.isPending}>
                      {criarHipotese.isPending ? 'Criando...' : 'Criar hipótese'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredHipoteses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma hipótese encontrada para os filtros selecionados. Crie novas hipóteses para
              guiar a investigação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {iaSugestoes.length > 0 && (
            <Card className="border-primary-200/70 bg-primary-50/60 dark:border-primary-900/40 dark:bg-primary-950/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold text-primary-900 dark:text-primary-100">
                      Sugestões da IA
                    </CardTitle>
                    <p className="text-sm text-primary-800/80 dark:text-primary-200">
                      Revise as hipóteses propostas e adapte conforme o contexto do discovery.
                    </p>
                  </div>
                  <Badge variant="info">IA Assist</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {iaSugestoes.map((item, index) => (
                  <div
                    key={`${item.titulo}-${index}`}
                    className="rounded-lg border border-primary-200/60 bg-white/80 p-4 dark:border-primary-800/50 dark:bg-primary-950/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-primary-900 dark:text-primary-100">
                          {item.titulo}
                        </h4>
                        <p className="mt-1 text-sm text-primary-800/90 dark:text-primary-100/90">
                          {item.descricao}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        Prioridade {item.prioridade}
                      </Badge>
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs text-primary-700 dark:text-primary-200">
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">Impacto esperado</dt>
                        <dd>{item.impactoEsperado}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">Como validar</dt>
                        <dd>{item.comoValidar}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {filteredHipoteses.map((hipotese, index) => (
            <FadeIn key={hipotese.id} delay={index * 0.05}>
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(hipotese.status)}>
                        {hipotese.statusLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Criada em {new Date(hipotese.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <CardTitle className="text-base font-semibold">{hipotese.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground">{hipotese.descricao}</p>
                  </div>
                  <div className="w-full max-w-[220px]">
                    <Select
                      value={hipotese.status}
                      onValueChange={(value) => {
                        setUpdatingId(hipotese.id)
                        atualizarStatus.mutate(
                          { hipoteseId: hipotese.id, status: value },
                          {
                            onSettled: () => setUpdatingId(null),
                          },
                        )
                      }}
                    >
                      <SelectTrigger disabled={updatingId === hipotese.id}>
                        <SelectValue placeholder="Atualizar status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <InfoChip label="Impacto esperado" value={hipotese.impactoEsperado} />
                  <InfoChip label="Prioridade" value={hipotese.prioridade} />
                  <InfoChip label="Métrica alvo" value={hipotese.metricaAlvo ?? '—'} />
                </CardContent>
                <CardFooter className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Evidências: <strong>{hipotese.qtdEvidencias}</strong>
                  </span>
                  <span>
                    Experimentos: <strong>{hipotese.qtdExperimentos}</strong>
                  </span>
                </CardFooter>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}

const InfoChip = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="rounded-lg border border-border bg-background/60 p-3">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-medium text-text-primary">{value ?? '—'}</p>
  </div>
)

const statusBadgeVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'validada':
      return 'success'
    case 'em_teste':
    case 'em teste':
      return 'info'
    case 'refutada':
      return 'destructive'
    default:
      return 'outline'
  }
}

const matchesSearch = (hipotese: DiscoveryCompleto['hipoteses'][number], term: string) => {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return true
  return (
    hipotese.titulo.toLowerCase().includes(normalized) ||
    hipotese.descricao.toLowerCase().includes(normalized) ||
    hipotese.comoValidar.toLowerCase().includes(normalized) ||
    hipotese.metricaAlvo?.toLowerCase().includes(normalized) ||
    hipotese.impactoEsperado.toLowerCase().includes(normalized) ||
    hipotese.prioridade.toLowerCase().includes(normalized) ||
    hipotese.statusLabel.toLowerCase().includes(normalized)
  )
}
