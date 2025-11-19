'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mic, Sparkles, FileText, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'

import { useEntrevistaDetalhe, useGerarInsight, useCriarEvidencia } from '@/hooks/use-discovery'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

type PageProps = {
  params: { id: string; pesquisaId: string; entrevistaId: string }
}

const insightSchema = z.object({
  descricao: z.string().min(10, 'Descreva o insight com maior contexto.'),
  impacto: z.string().min(1, 'Selecione o impacto.'),
  confianca: z.string().min(1, 'Selecione o nível de confiança.'),
  tags: z.string().optional(),
})

const evidenciaSchema = z.object({
  titulo: z.string().min(3, 'Informe um título.'),
  descricao: z.string().min(10, 'Descreva a evidência.'),
  tipo: z.string().min(1, 'Selecione o tipo.'),
  tags: z.string().optional(),
})

type InsightFormValues = z.infer<typeof insightSchema>
type EvidenciaFormValues = z.infer<typeof evidenciaSchema>

export default function EntrevistaDetalhePage({ params }: PageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: entrevista,
    isLoading,
    isError,
  } = useEntrevistaDetalhe(params.pesquisaId, params.entrevistaId)

  const impactoCatalog = useCatalogItemsBySlug('impacto_insight', { includeInativos: false })
  const confiancaCatalog = useCatalogItemsBySlug('confianca_insight', { includeInativos: false })
  const tipoEvidenciaCatalog = useCatalogItemsBySlug('tipo_evidencia', { includeInativos: false })

  const gerarInsight = useGerarInsight(params.id)
  const criarEvidencia = useCriarEvidencia(params.id)

  const insightForm = useForm<InsightFormValues>({
    resolver: zodResolver(insightSchema),
    defaultValues: {
      impacto: impactoCatalog.data?.itens?.[0]?.slug ?? '',
      confianca: confiancaCatalog.data?.itens?.[0]?.slug ?? '',
    },
  })

  const evidenciaForm = useForm<EvidenciaFormValues>({
    resolver: zodResolver(evidenciaSchema),
    defaultValues: {
      tipo: tipoEvidenciaCatalog.data?.itens?.[0]?.slug ?? '',
    },
  })

  const [insightDialogOpen, setInsightDialogOpen] = useState(false)
  const [evidenciaDialogOpen, setEvidenciaDialogOpen] = useState(false)

  const formattedTags = useMemo(() => entrevista?.tags ?? [], [entrevista])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Carregando entrevista...</p>
      </div>
    )
  }

  if (isError || !entrevista) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>Não foi possível localizar esta entrevista.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    )
  }

  const handleCreateInsight = (values: InsightFormValues) => {
    gerarInsight.mutate(
      {
        entrevistaId: entrevista.id,
        descricao: values.descricao,
        impacto: values.impacto,
        confianca: values.confianca,
        tags: splitToArray(values.tags),
      },
      {
        onSuccess: async () => {
          setInsightDialogOpen(false)
          insightForm.reset({
            descricao: '',
            impacto: impactoCatalog.data?.itens?.[0]?.slug ?? '',
            confianca: confiancaCatalog.data?.itens?.[0]?.slug ?? '',
            tags: '',
          })
          await queryClient.invalidateQueries({
            queryKey: ['entrevista', params.pesquisaId, params.entrevistaId],
          })
        },
      },
    )
  }

  const handleCreateEvidencia = (values: EvidenciaFormValues) => {
    criarEvidencia.mutate(
      {
        titulo: values.titulo,
        descricao: values.descricao,
        tipo: values.tipo,
        tags: splitToArray(values.tags),
      },
      {
        onSuccess: () => {
          setEvidenciaDialogOpen(false)
          evidenciaForm.reset({
            titulo: '',
            descricao: '',
            tipo: tipoEvidenciaCatalog.data?.itens?.[0]?.slug ?? '',
            tags: '',
          })
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold text-text-primary">
              Entrevista com {entrevista.participanteNome}
            </CardTitle>
            <CardDescription className="text-sm">
              Realizada em {new Date(entrevista.dataHora).toLocaleString('pt-BR')}
            </CardDescription>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {entrevista.participantePerfil && (
                <Badge variant="outline">{entrevista.participantePerfil}</Badge>
              )}
              {entrevista.duracaoMinutos && (
                <Badge variant="outline">{entrevista.duracaoMinutos} min</Badge>
              )}
              <Badge variant="outline">Pesquisa #{entrevista.pesquisaId}</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Dialog open={insightDialogOpen} onOpenChange={setInsightDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gerar insight
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo insight a partir desta entrevista</DialogTitle>
                  <DialogDescription>
                    Registre aprendizados qualitativos estruturados e compartilhe com o time.
                  </DialogDescription>
                </DialogHeader>
                <Form {...insightForm}>
                  <form
                    onSubmit={insightForm.handleSubmit(handleCreateInsight)}
                    className="space-y-4"
                  >
                    <FormField
                      control={insightForm.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="O que aprendemos com esta entrevista?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={insightForm.control}
                        name="impacto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impacto</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                        control={insightForm.control}
                        name="confianca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confiança</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
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
                      control={insightForm.control}
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

            <Dialog open={evidenciaDialogOpen} onOpenChange={setEvidenciaDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Criar evidência
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova evidência desta entrevista</DialogTitle>
                  <DialogDescription>
                    Registre fatos e dados coletados durante a entrevista para sustentar hipóteses.
                  </DialogDescription>
                </DialogHeader>
                <Form {...evidenciaForm}>
                  <form
                    onSubmit={evidenciaForm.handleSubmit(handleCreateEvidencia)}
                    className="space-y-4"
                  >
                    <FormField
                      control={evidenciaForm.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex.: Usuário não encontra botão avançar"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={evidenciaForm.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              minRows={4}
                              placeholder="Detalhe a evidência observada"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={evidenciaForm.control}
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
                              {tipoEvidenciaCatalog.data?.itens?.map((item) => (
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
                      control={evidenciaForm.control}
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
                      <Button type="submit" disabled={criarEvidencia.isPending}>
                        {criarEvidencia.isPending ? 'Salvando...' : 'Registrar evidência'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {entrevista.gravacaoUrl && (
            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Mic className="h-4 w-4" /> Gravação
              </h4>
              <audio controls className="w-full">
                <source src={entrevista.gravacaoUrl} />
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-text-primary">Notas</h4>
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                {entrevista.notas ? (
                  <ScrollArea className="max-h-64">
                    <p>{entrevista.notas}</p>
                  </ScrollArea>
                ) : (
                  <p>Nenhuma nota registrada.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-text-primary">Transcrição</h4>
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                {entrevista.transcricao ? (
                  <ScrollArea className="max-h-64">
                    <pre className="whitespace-pre-wrap font-sans">{entrevista.transcricao}</pre>
                  </ScrollArea>
                ) : (
                  <p>Transcrição ainda não disponível.</p>
                )}
              </div>
            </div>
          </div>

          {formattedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {formattedTags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Insights derivados</h4>
            {entrevista.insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não existem insights registrados a partir desta entrevista.
              </p>
            ) : (
              <div className="grid gap-3">
                {entrevista.insights.map((insight) => (
                  <Card key={insight.id} className="border-dashed">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{insight.impactoLabel}</Badge>
                        <Badge variant="outline">{insight.confiancaLabel}</Badge>
                        <Badge variant="outline">{insight.statusLabel}</Badge>
                      </div>
                      <CardTitle className="text-base font-semibold">{insight.descricao}</CardTitle>
                      <CardDescription className="text-xs">
                        Criado em {new Date(insight.createdAt).toLocaleString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Entre em contato com o participante caso precise de follow-up e lembre-se de aplicar as
        aprendizagens ao backlog de hipóteses.
      </div>
    </div>
  )
}

const splitToArray = (value?: string): string[] | undefined => {
  if (!value) return undefined
  const tokens = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tokens.length > 0 ? tokens : undefined
}
