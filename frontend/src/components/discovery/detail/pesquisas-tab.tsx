import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import { DiscoveryCompleto } from '@/lib/discovery-api'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { useAdicionarEntrevista, useRegistrarPesquisa } from '@/hooks/use-discovery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { useDiscoverySearch } from '@/components/discovery/detail/search-context'
import { pesquisaTemplates } from '@/components/discovery/detail/templates'
import { FadeIn } from '@/components/motion/fade-in'

type PesquisasTabProps = {
  discovery: DiscoveryCompleto
}

const pesquisaSchema = z.object({
  titulo: z.string().min(3, 'Informe um título com pelo menos 3 caracteres'),
  metodo: z.string().min(1, 'Selecione um método'),
  objetivo: z.string().min(10, 'Descreva o objetivo da pesquisa'),
  roteiroUrl: z.string().url('Informe uma URL válida').optional().or(z.literal('')),
  totalParticipantes: z.coerce.number().min(1, 'Informe o número de participantes'),
})

const entrevistaSchema = z.object({
  participanteNome: z.string().min(2, 'Nome obrigatório'),
  participantePerfil: z.string().optional(),
  participanteEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  dataHora: z.string().min(1, 'Informe data e hora'),
  notas: z.string().optional(),
  tags: z.string().optional(),
  gravacaoUrl: z.string().url('Informe uma URL válida').optional().or(z.literal('')),
  duracaoMinutos: z.coerce.number().min(1).optional(),
})

type PesquisaFormValues = z.infer<typeof pesquisaSchema>
type EntrevistaFormValues = z.infer<typeof entrevistaSchema>

export function DiscoveryPesquisasTab({ discovery }: PesquisasTabProps) {
  const router = useRouter()
  const { globalSearchTerm } = useDiscoverySearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [pesquisaDialogOpen, setPesquisaDialogOpen] = useState(false)
  const [entrevistaDialogOpen, setEntrevistaDialogOpen] = useState(false)
  const [selectedPesquisaId, setSelectedPesquisaId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('none')

  const registrarPesquisa = useRegistrarPesquisa(discovery.id)
  const adicionarEntrevistaMutation = useAdicionarEntrevista(selectedPesquisaId ?? '')

  const metodoCatalog = useCatalogItemsBySlug('metodo_pesquisa', { includeInativos: false })
  const statusCatalog = useCatalogItemsBySlug('status_pesquisa', { includeInativos: false })

  const pesquisaForm = useForm<PesquisaFormValues>({
    resolver: zodResolver(pesquisaSchema),
    defaultValues: {
      titulo: '',
      metodo: metodoCatalog.data?.itens?.[0]?.slug ?? '',
      objetivo: '',
      roteiroUrl: '',
      totalParticipantes: 8,
    },
  })

  const entrevistaForm = useForm<EntrevistaFormValues>({
    resolver: zodResolver(entrevistaSchema),
    defaultValues: {
      participanteNome: '',
      participantePerfil: '',
      participanteEmail: '',
      dataHora: '',
      notas: '',
      tags: '',
      gravacaoUrl: '',
      duracaoMinutos: undefined,
    },
  })

  const filteredPesquisas = useMemo(() => {
    const collection =
      statusFilter === 'all'
        ? discovery.pesquisas
        : discovery.pesquisas.filter(
            (pesquisa) => pesquisa.status.toLowerCase() === statusFilter.toLowerCase(),
          )
    if (!globalSearchTerm) return collection
    return collection.filter((pesquisa) => matchesSearch(pesquisa, globalSearchTerm))
  }, [discovery.pesquisas, statusFilter, globalSearchTerm])

  const onCreatePesquisa = (values: PesquisaFormValues) => {
    registrarPesquisa.mutate(values, {
      onSuccess: () => {
        pesquisaForm.reset({
          titulo: '',
          metodo: metodoCatalog.data?.itens?.[0]?.slug ?? '',
          objetivo: '',
          roteiroUrl: '',
          totalParticipantes: 8,
        })
        setPesquisaDialogOpen(false)
        setSelectedTemplate('none')
      },
    })
  }

  const onCreateEntrevista = (values: EntrevistaFormValues) => {
    if (!selectedPesquisaId) return

    const payload = {
      participanteNome: values.participanteNome,
      participantePerfil: values.participantePerfil || undefined,
      participanteEmail: values.participanteEmail || undefined,
      dataHora: values.dataHora,
      notas: values.notas,
      transcricao: undefined,
      gravacaoUrl: values.gravacaoUrl || undefined,
      tags: splitToArray(values.tags),
      duracaoMinutos: values.duracaoMinutos,
    }

    adicionarEntrevistaMutation.mutate(payload, {
      onSuccess: () => {
        entrevistaForm.reset()
        setEntrevistaDialogOpen(false)
        setSelectedPesquisaId(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Pesquisas ({discovery.pesquisas.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Organize entrevistas, surveys e demais métodos de descoberta. Monitore o progresso de
            recrutamento e execução.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar status" />
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

          <Dialog open={pesquisaDialogOpen} onOpenChange={setPesquisaDialogOpen}>
            <DialogTrigger asChild>
              <Button>Nova pesquisa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar pesquisa</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova etapa de pesquisa para organizar entrevistas, surveys ou testes
                  de usabilidade.
                </DialogDescription>
              </DialogHeader>
              <Form {...pesquisaForm}>
                <form onSubmit={pesquisaForm.handleSubmit(onCreatePesquisa)} className="space-y-4">
                  <FormItem>
                    <FormLabel>Aplicar template</FormLabel>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        setSelectedTemplate(value)
                        if (value === 'none') return
                        const template = pesquisaTemplates.find((item) => item.label === value)
                        if (template) {
                          pesquisaForm.reset({
                            titulo: template.values.titulo,
                            metodo: template.values.metodo,
                            objetivo: template.values.objetivo,
                            roteiroUrl: template.values.roteiroUrl,
                            totalParticipantes: template.values.totalParticipantes,
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
                        {pesquisaTemplates.map((template) => (
                          <SelectItem key={template.label} value={template.label}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <FormField
                    control={pesquisaForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Entrevistas com novos clientes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={pesquisaForm.control}
                    name="metodo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {metodoCatalog.data?.itens?.map((item) => (
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
                    control={pesquisaForm.control}
                    name="objetivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={4}
                            placeholder="Ex.: Entender a jornada e dificuldades no passo 3 do onboarding."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={pesquisaForm.control}
                      name="totalParticipantes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total de participantes</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={pesquisaForm.control}
                      name="roteiroUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roteiro (URL)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={registrarPesquisa.isPending}>
                      {registrarPesquisa.isPending ? 'Salvando...' : 'Registrar pesquisa'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredPesquisas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma pesquisa cadastrada para este discovery. Comece registrando entrevistas,
            pesquisas quantitativas ou testes de usabilidade.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPesquisas.map((pesquisa, index) => {
            const progresso = Math.min(100, Math.round(pesquisa.progressoPercentual ?? 0))

            return (
              <FadeIn key={pesquisa.id} delay={index * 0.05}>
                <Card>
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{pesquisa.metodoLabel}</Badge>
                        <Badge variant={statusBadgeVariant(pesquisa.status)}>
                          {pesquisa.statusLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Criada em {new Date(pesquisa.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold">{pesquisa.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{pesquisa.objetivo}</p>
                      {pesquisa.roteiroUrl && (
                        <a
                          href={pesquisa.roteiroUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          Abrir roteiro
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPesquisaId(pesquisa.id)
                          setEntrevistaDialogOpen(true)
                        }}
                      >
                        Registrar entrevista
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-[220px] flex-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progresso</span>
                          <span>
                            {pesquisa.participantesConcluidos}/{pesquisa.totalParticipantes}
                          </span>
                        </div>
                        <Progress value={progresso} className="mt-2" />
                      </div>
                      <Badge variant="outline">Entrevistas: {pesquisa.qtdEntrevistas}</Badge>
                    </div>

                    {pesquisa.entrevistas && pesquisa.entrevistas.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Entrevistas recentes
                        </p>
                        <div className="flex flex-col gap-2">
                          {pesquisa.entrevistas.slice(0, 3).map((entrevista) => (
                            <div
                              key={entrevista.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-text-primary">
                                  {entrevista.participanteNome}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(entrevista.dataHora).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/discovery/${discovery.id}/pesquisas/${pesquisa.id}/entrevistas/${entrevista.id}`,
                                  )
                                }
                              >
                                Abrir entrevista
                              </Button>
                            </div>
                          ))}
                          {pesquisa.entrevistas.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              {pesquisa.entrevistas.length - 3} entrevista(s) adicional(is)
                              disponível(is) nos detalhes da pesquisa.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            )
          })}
        </div>
      )}

      <Dialog open={entrevistaDialogOpen} onOpenChange={setEntrevistaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar entrevista</DialogTitle>
            <DialogDescription>
              Registre a entrevista imediatamente após realizá-la para manter o histórico completo.
            </DialogDescription>
          </DialogHeader>
          <Form {...entrevistaForm}>
            <form onSubmit={entrevistaForm.handleSubmit(onCreateEntrevista)} className="space-y-4">
              <FormField
                control={entrevistaForm.control}
                name="participanteNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do participante</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={entrevistaForm.control}
                  name="participantePerfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Cliente enterprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={entrevistaForm.control}
                  name="participanteEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={entrevistaForm.control}
                name="dataHora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e hora</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={entrevistaForm.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea minRows={3} placeholder="Principais observações..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={entrevistaForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Separe por vírgula" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={entrevistaForm.control}
                  name="duracaoMinutos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={entrevistaForm.control}
                name="gravacaoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da gravação</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={adicionarEntrevistaMutation.isPending}>
                  {adicionarEntrevistaMutation.isPending
                    ? 'Registrando...'
                    : 'Registrar entrevista'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const splitToArray = (value?: string): string[] | undefined => {
  if (!value) return undefined
  const entries = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return entries.length > 0 ? entries : undefined
}

const statusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'em_andamento':
    case 'em andamento':
      return 'info'
    case 'concluida':
      return 'success'
    case 'cancelada':
      return 'destructive'
    default:
      return 'outline'
  }
}

const matchesSearch = (pesquisa: DiscoveryCompleto['pesquisas'][number], term: string) => {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return true
  return (
    pesquisa.titulo.toLowerCase().includes(normalized) ||
    pesquisa.objetivo.toLowerCase().includes(normalized) ||
    pesquisa.metodoLabel?.toLowerCase().includes(normalized) ||
    pesquisa.entrevistas?.some((entrevista) =>
      entrevista.participanteNome.toLowerCase().includes(normalized),
    )
  )
}
