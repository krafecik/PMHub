'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GitBranch, Trash2, Plus, Network, List } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HelpButton } from '@/components/ui/help-button'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { FadeIn } from '@/components/motion'
import {
  listarTodasDependencias,
  removerDependencia,
  registrarDependencia,
  listarFeatures,
} from '@/lib/planejamento-api'
import { DependenciesGraph } from '@/components/planejamento/dependencies-graph'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const dependenciasHelpContent = (
  <div className="space-y-4">
    <p>
      Visualize e gerencie as dependências entre features. Dependências podem bloquear o progresso
      de features e precisam ser monitoradas de perto.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Tipos de Dependência:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Hard:</strong> Bloqueio crítico - a feature não pode avançar
        </li>
        <li>
          <strong>Soft:</strong> Dependência suave - pode avançar mas com limitações
        </li>
        <li>
          <strong>Recurso:</strong> Dependência de recursos compartilhados
        </li>
      </ul>
    </div>
  </div>
)

const dependenciaSchema = z.object({
  featureBloqueadaId: z.string().min(1, 'Selecione a feature bloqueada'),
  featureBloqueadoraId: z.string().min(1, 'Selecione a feature bloqueadora'),
  tipo: z.enum(['HARD', 'SOFT', 'RECURSO'], {
    required_error: 'Selecione o tipo de dependência',
  }),
  risco: z.enum(['CRITICO', 'ALTO', 'MEDIO', 'BAIXO'], {
    required_error: 'Selecione o nível de risco',
  }),
  nota: z.string().optional(),
})

type DependenciaFormValues = z.infer<typeof dependenciaSchema>

export default function DependenciasPage() {
  const [quarter, setQuarter] = useState<string>('all')
  const [epicoId, _setEpicoId] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const form = useForm<DependenciaFormValues>({
    resolver: zodResolver(dependenciaSchema),
    defaultValues: {
      featureBloqueadaId: '',
      featureBloqueadoraId: '',
      tipo: 'HARD',
      risco: 'MEDIO',
      nota: '',
    },
  })

  const { data: dependencias = [], isLoading } = useQuery({
    queryKey: ['dependencias', quarter, epicoId],
    queryFn: () =>
      listarTodasDependencias({
        quarter: quarter !== 'all' ? quarter : undefined,
        epicoId: epicoId || undefined,
      }),
  })

  const { data: featuresData } = useQuery({
    queryKey: ['features', quarter],
    queryFn: () => listarFeatures({ quarter: quarter !== 'all' ? quarter : undefined }),
  })

  const removerMutation = useMutation({
    mutationFn: removerDependencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencias'] })
      toast({
        title: 'Dependência removida',
        description: 'A dependência foi removida com sucesso.',
      })
    },
  })

  const criarMutation = useMutation({
    mutationFn: registrarDependencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencias'] })
      toast({
        title: 'Dependência criada',
        description: 'A dependência foi registrada com sucesso.',
      })
      setIsModalOpen(false)
      form.reset()
    },
    onError: () => {
      toast({
        title: 'Erro ao criar dependência',
        description: 'Não foi possível criar a dependência. Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (values: DependenciaFormValues) => {
    criarMutation.mutate(values)
  }

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'CRITICO':
        return 'destructive'
      case 'ALTO':
        return 'warning'
      case 'MEDIO':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'HARD':
        return 'Hard'
      case 'SOFT':
        return 'Soft'
      case 'RECURSO':
        return 'Recurso'
      default:
        return tipo
    }
  }

  const getFeatureNome = (featureId: string) => {
    const feature = featuresData?.data?.find((f) => f.id === featureId)
    return feature?.titulo || featureId
  }

  const featuresMap = useMemo(() => {
    const map: Record<string, { titulo: string; status?: string }> = {}
    featuresData?.data?.forEach((feature) => {
      map[feature.id] = {
        titulo: feature.titulo,
        status: feature.status,
      }
    })
    return map
  }, [featuresData])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Dependências</h1>
          <p className="text-text-secondary">
            Visualize o mapa de dependências entre features e identifique bloqueios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Dependência
          </Button>
          <HelpButton title="Ajuda - Dependências" content={dependenciasHelpContent} />
        </div>
      </header>

      <div className="flex gap-4">
        <Select value={quarter} onValueChange={setQuarter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Q1 2026">Q1 2026</SelectItem>
            <SelectItem value="Q2 2026">Q2 2026</SelectItem>
            <SelectItem value="Q3 2026">Q3 2026</SelectItem>
            <SelectItem value="Q4 2026">Q4 2026</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'graph')}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="graph">
              <Network className="mr-2 h-4 w-4" />
              Graph
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <Card variant="outline" className="p-6">
          <p className="text-text-secondary">Carregando dependências...</p>
        </Card>
      ) : dependencias.length === 0 ? (
        <Card variant="ghost" className="p-12">
          <AnimatedEmptyState
            icon={<AnimatedIllustration type="empty" />}
            title="Nenhuma dependência cadastrada"
            description="As dependências entre features serão exibidas aqui quando cadastradas."
          />
        </Card>
      ) : viewMode === 'graph' ? (
        <DependenciesGraph dependencias={dependencias} featuresMap={featuresMap} />
      ) : (
        <div className="space-y-4">
          {dependencias.map((dep) => (
            <FadeIn key={dep.id} delay={0.1}>
              <Card variant="outline" className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-text-muted" />
                      <span className="text-sm font-medium text-text-primary">
                        {getFeatureNome(dep.featureBloqueadaId)}
                      </span>
                      <span className="text-text-muted">depende de</span>
                      <span className="text-sm font-medium text-text-primary">
                        {getFeatureNome(dep.featureBloqueadoraId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiscoColor(dep.risco)}>{dep.risco}</Badge>
                      <Badge variant="outline">{getTipoLabel(dep.tipo)}</Badge>
                    </div>
                    {dep.nota && <p className="mt-2 text-sm text-text-secondary">{dep.nota}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Deseja remover esta dependência?')) {
                        removerMutation.mutate(dep.id)
                      }
                    }}
                    disabled={removerMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}

      {/* Modal de Nova Dependência */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Dependência</DialogTitle>
            <DialogDescription>
              Registre uma dependência entre features. A feature bloqueada depende da feature
              bloqueadora.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="featureBloqueadaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Bloqueada</FormLabel>
                      <FormControl>
                        <select
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        >
                          <option value="">Selecione...</option>
                          {featuresData?.data?.map((feature) => (
                            <option key={feature.id} value={feature.id}>
                              {feature.titulo}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featureBloqueadoraId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Bloqueadora</FormLabel>
                      <FormControl>
                        <select
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        >
                          <option value="">Selecione...</option>
                          {featuresData?.data
                            ?.filter((f) => f.id !== form.watch('featureBloqueadaId'))
                            .map((feature) => (
                              <option key={feature.id} value={feature.id}>
                                {feature.titulo}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <select
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        >
                          <option value="HARD">Hard - Bloqueio crítico</option>
                          <option value="SOFT">Soft - Dependência suave</option>
                          <option value="RECURSO">Recurso - Recursos compartilhados</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="risco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Risco</FormLabel>
                      <FormControl>
                        <select
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        >
                          <option value="CRITICO">Crítico</option>
                          <option value="ALTO">Alto</option>
                          <option value="MEDIO">Médio</option>
                          <option value="BAIXO">Baixo</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="nota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione observações sobre esta dependência..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsModalOpen(false)
                    form.reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={criarMutation.isPending}>
                  {criarMutation.isPending ? 'Salvando...' : 'Criar Dependência'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
