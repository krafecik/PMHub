'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarSquads,
  PlanejamentoSquad,
  salvarSquad,
  removerSquad,
  listarPlanningCycles,
  PlanningCycle,
  criarPlanningCycle,
  atualizarPlanningCycle,
  removerPlanningCycle,
} from '@/lib/planejamento-api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpButton } from '@/components/ui/help-button'
import { planejamentoConfigHelpContent } from '@/components/planejamento/help-content'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { useToast } from '@/hooks/use-toast'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { Plus, Pencil, Trash2, Users, Layers3, Loader2 } from 'lucide-react'

const AVAILABLE_QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026']

const squadSchema = z.object({
  nome: z.string().min(2, 'Informe o nome do squad'),
  slug: z.string().optional(),
  produtoId: z.string().optional(),
  descricao: z.string().optional(),
  corToken: z.string().optional(),
  timezone: z.string().optional(),
  capacidadePadrao: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : Number(value))),
  statusSlug: z.string().min(1, 'Selecione um status'),
})

const checklistItemSchema = z.object({
  chave: z.string().min(1, 'Informe a chave'),
  label: z.string().min(1, 'Informe o rótulo'),
  responsavel: z.string().optional(),
})

const planningCycleSchema = z.object({
  produtoId: z.string().optional(),
  quarter: z.string().min(3, 'Informe o quarter'),
  agendaUrl: z.string().optional(),
  participantesConfirmados: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : Number(value))),
  participantesTotais: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : Number(value))),
  checklist: z.array(checklistItemSchema).optional(),
  notas: z.string().optional(),
})

type SquadFormValues = z.infer<typeof squadSchema>
type PlanningCycleFormValues = z.infer<typeof planningCycleSchema>

export default function PlanejamentoConfigPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'squads' | 'cycles'>('squads')
  const [isSquadModalOpen, setSquadModalOpen] = useState(false)
  const [isCycleModalOpen, setCycleModalOpen] = useState(false)
  const [editingSquad, setEditingSquad] = useState<PlanejamentoSquad | null>(null)
  const [editingCycle, setEditingCycle] = useState<PlanningCycle | null>(null)
  const [isSavingSquad, setSavingSquad] = useState(false)
  const [isSavingCycle, setSavingCycle] = useState(false)

  const squadsQuery = useQuery({
    queryKey: ['planejamento-squads'],
    queryFn: listarSquads,
  })

  const cyclesQuery = useQuery({
    queryKey: ['planejamento-cycles'],
    queryFn: () => listarPlanningCycles(),
  })

  const squadStatusCatalog = useCatalogItemsBySlug('planejamento_squad_status', {
    includeInativos: false,
  })

  const squadStatusOptions = useMemo(() => {
    const items = squadStatusCatalog.data?.itens ?? []
    return items
      .filter((item) => item.ativo !== false)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((item) => ({
        value: item.slug,
        label: item.label,
        metadata: item.metadata as Record<string, unknown> | null | undefined,
        legacyValue: (item.metadata as Record<string, unknown> | undefined)?.legacyValue as
          | string
          | undefined,
      }))
  }, [squadStatusCatalog.data])

  const defaultSquadStatusSlug = squadStatusOptions[0]?.value ?? ''

  const squadForm = useForm<SquadFormValues>({
    resolver: zodResolver(squadSchema),
    defaultValues: {
      nome: '',
      statusSlug: defaultSquadStatusSlug,
      timezone: 'America/Sao_Paulo',
    },
  })

  useEffect(() => {
    if (squadStatusOptions.length === 0) return
    const current = squadForm.getValues('statusSlug')
    if (!current) {
      squadForm.setValue('statusSlug', squadStatusOptions[0].value)
    }
  }, [squadForm, squadStatusOptions])

  const cycleForm = useForm<PlanningCycleFormValues>({
    resolver: zodResolver(planningCycleSchema),
    defaultValues: {
      produtoId: '',
      quarter: AVAILABLE_QUARTERS[0],
      agendaUrl: '',
      participantesConfirmados: undefined,
      participantesTotais: undefined,
      checklist: [],
      notas: '',
    },
  })

  const checklistFieldArray = useFieldArray({
    control: cycleForm.control,
    name: 'checklist',
  })

  const squads = squadsQuery.data ?? []
  const cycles = cyclesQuery.data ?? []

  type BadgeVariant = NonNullable<BadgeProps['variant']>
  const allowedBadgeVariants: BadgeVariant[] = [
    'default',
    'secondary',
    'destructive',
    'outline',
    'success',
    'warning',
    'info',
  ]

  const readMetadataString = (
    metadata: Record<string, unknown> | null | undefined,
    key: string,
  ): string | undefined => {
    if (!metadata) return undefined
    const value = (metadata as Record<string, unknown>)[key]
    return typeof value === 'string' ? value : undefined
  }

  const resolveSquadStatusVariant = (
    metadata: Record<string, unknown> | null | undefined,
    slug?: string,
  ): BadgeVariant => {
    const configured = readMetadataString(metadata, 'badgeVariant')
    if (configured && allowedBadgeVariants.includes(configured as BadgeVariant)) {
      return configured as BadgeVariant
    }

    const legacy = readMetadataString(metadata, 'legacyValue')?.toUpperCase()
    if (legacy === 'ACTIVE') return 'success'
    if (legacy === 'INACTIVE') return 'secondary'
    if (slug) {
      const normalized = slug.toLowerCase()
      if (normalized === 'ativo') return 'success'
      if (normalized === 'inativo') return 'secondary'
    }
    return 'secondary'
  }

  const resolvePlanningCycleStatusVariant = (
    metadata: Record<string, unknown> | null | undefined,
    slug?: string,
  ): BadgeVariant => {
    const configured = readMetadataString(metadata, 'badgeVariant')
    if (configured && allowedBadgeVariants.includes(configured as BadgeVariant)) {
      return configured as BadgeVariant
    }

    switch ((slug ?? '').toLowerCase()) {
      case 'not_started':
        return 'outline'
      case 'preparation':
        return 'info'
      case 'alignment':
        return 'secondary'
      case 'commitment':
        return 'warning'
      case 'closed':
        return 'success'
      default:
        return 'secondary'
    }
  }

  const openCreateSquadModal = () => {
    setEditingSquad(null)
    squadForm.reset({
      nome: '',
      slug: '',
      produtoId: '',
      descricao: '',
      corToken: '',
      timezone: 'America/Sao_Paulo',
      capacidadePadrao: undefined,
      statusSlug: squadStatusOptions[0]?.value ?? '',
    })
    setSquadModalOpen(true)
  }

  const openEditSquadModal = (squad: PlanejamentoSquad) => {
    setEditingSquad(squad)
    squadForm.reset({
      nome: squad.nome,
      slug: squad.slug,
      produtoId: squad.produtoId ?? '',
      descricao: squad.descricao ?? '',
      corToken: squad.corToken ?? '',
      timezone: squad.timezone ?? 'America/Sao_Paulo',
      capacidadePadrao: squad.capacidadePadrao,
      statusSlug: squad.statusSlug ?? squadStatusOptions[0]?.value ?? '',
    })
    setSquadModalOpen(true)
  }

  const openCreateCycleModal = () => {
    setEditingCycle(null)
    cycleForm.reset({
      produtoId: '',
      quarter: AVAILABLE_QUARTERS[0],
      agendaUrl: '',
      participantesConfirmados: undefined,
      participantesTotais: undefined,
      checklist: [],
      notas: '',
    })
    checklistFieldArray.remove()
    setCycleModalOpen(true)
  }

  const openEditCycleModal = (cycle: PlanningCycle) => {
    setEditingCycle(cycle)
    cycleForm.reset({
      produtoId: cycle.produtoId ?? '',
      quarter: cycle.quarter,
      agendaUrl: cycle.agendaUrl ?? '',
      participantesConfirmados: cycle.participantesConfirmados,
      participantesTotais: cycle.participantesTotais,
      checklist: cycle.checklist?.map((item) => ({
        chave: item.chave,
        label: item.label,
        responsavel: item.responsavel ?? '',
      })),
      notas: cycle.dadosPreparacao ? JSON.stringify(cycle.dadosPreparacao, null, 2) : '',
    })
    checklistFieldArray.replace(
      cycle.checklist?.map((item) => ({
        chave: item.chave,
        label: item.label,
        responsavel: item.responsavel ?? '',
      })) ?? [],
    )
    setCycleModalOpen(true)
  }

  const closeSquadModal = () => {
    setSquadModalOpen(false)
    setEditingSquad(null)
  }

  const closeCycleModal = () => {
    setCycleModalOpen(false)
    setEditingCycle(null)
  }

  const handleSubmitSquad = async (values: SquadFormValues) => {
    setSavingSquad(true)
    try {
      const { statusSlug, ...rest } = values
      const payload = {
        ...rest,
        status: statusSlug,
        produtoId: rest.produtoId || undefined,
        slug: rest.slug || undefined,
      }
      const result = await salvarSquad(payload, editingSquad?.id)
      await queryClient.invalidateQueries({ queryKey: ['planejamento-squads'] })
      toast({
        title: 'Sucesso',
        description: result.message,
      })
      closeSquadModal()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao salvar squad',
        description: 'Tente novamente ou verifique os dados informados.',
        variant: 'destructive',
      })
    } finally {
      setSavingSquad(false)
    }
  }

  const handleDeleteSquad = async (squadId: string) => {
    try {
      await removerSquad(squadId)
      await queryClient.invalidateQueries({ queryKey: ['planejamento-squads'] })
      toast({ title: 'Squad removido' })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao remover squad',
        description: 'Não foi possível remover o squad. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const buildChecklistPayload = (items?: PlanningCycleFormValues['checklist']) =>
    items?.map((item) => ({
      ...item,
      concluido: false,
    }))

  const parseNotas = (notas?: string) => {
    if (!notas) return undefined
    try {
      return JSON.parse(notas)
    } catch {
      return { notas }
    }
  }

  const handleSubmitCycle = async (values: PlanningCycleFormValues) => {
    setSavingCycle(true)
    try {
      const payload = {
        produtoId: values.produtoId || undefined,
        quarter: values.quarter,
        agendaUrl: values.agendaUrl || undefined,
        participantesConfirmados: values.participantesConfirmados,
        participantesTotais: values.participantesTotais,
        checklist: buildChecklistPayload(values.checklist),
        dadosPreparacao: parseNotas(values.notas),
      }

      if (editingCycle) {
        await atualizarPlanningCycle(editingCycle.id, {
          agendaUrl: payload.agendaUrl,
          participantesConfirmados: payload.participantesConfirmados,
          participantesTotais: payload.participantesTotais,
          checklist: payload.checklist,
          dadosPreparacao: payload.dadosPreparacao,
        })
        toast({ title: 'Planning cycle atualizado' })
      } else {
        await criarPlanningCycle(payload)
        toast({ title: 'Planning cycle criado' })
      }

      await queryClient.invalidateQueries({ queryKey: ['planejamento-cycles'] })
      closeCycleModal()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao salvar planning cycle',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingCycle(false)
    }
  }

  const handleDeleteCycle = async (cycleId: string) => {
    try {
      await removerPlanningCycle(cycleId)
      await queryClient.invalidateQueries({ queryKey: ['planejamento-cycles'] })
      toast({ title: 'Planning cycle removido' })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao remover planning cycle',
        description: 'Não foi possível remover. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento</p>
          <h1 className="text-3xl font-bold text-text-primary">Catálogos e cadastros</h1>
          <p className="text-text-secondary">
            Administre squads e ciclos trimestrais sem depender de scripts ou seeds.
          </p>
        </div>
        <HelpButton
          title="Ajuda - Catálogos de Planejamento"
          content={planejamentoConfigHelpContent}
        />
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'squads' | 'cycles')}>
        <TabsList>
          <TabsTrigger value="squads">Squads</TabsTrigger>
          <TabsTrigger value="cycles">Planning cycles</TabsTrigger>
        </TabsList>

        <TabsContent value="squads" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Squads</h2>
              <p className="text-sm text-text-secondary">
                Cadastre squads para vincular épicos, capacidade e cenários.
              </p>
            </div>
            <Button onClick={openCreateSquadModal}>
              <Plus className="mr-2 h-4 w-4" />
              Novo squad
            </Button>
          </div>

          {squadsQuery.isLoading ? (
            <Card className="p-6">
              <AnimatedEmptyState
                icon={<AnimatedIllustration type="search" />}
                title="Carregando squads"
                description="Buscando cadastros de squads deste tenant."
              />
            </Card>
          ) : squads.length === 0 ? (
            <Card className="p-6">
              <AnimatedEmptyState
                icon={<AnimatedIllustration type="empty" />}
                title="Nenhum squad cadastrado"
                description="Cadastre o primeiro squad para começar o planejamento."
                action={
                  <Button variant="gradient" onClick={openCreateSquadModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar squad
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {squads.map((squad) => (
                <Card key={squad.id} variant="outline" className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{squad.nome}</h3>
                      <p className="text-xs uppercase text-text-muted">slug: {squad.slug}</p>
                    </div>
                    <Badge
                      variant={resolveSquadStatusVariant(squad.statusMetadata, squad.statusSlug)}
                    >
                      {squad.statusLabel}
                    </Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-text-secondary">
                    {squad.descricao || 'Sem descrição cadastrada.'}
                  </p>
                  <dl className="mt-4 space-y-1 text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        Capacidade padrão:{' '}
                        <strong>{squad.capacidadePadrao ?? 'não definida'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-3.5 w-3.5" />
                      <span>Produto: {squad.produtoId ?? '—'}</span>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditSquadModal(squad)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover squad</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação desativa o squad e ele não poderá ser usado em novos épicos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSquad(squad.id)}>
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cycles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Planning cycles</h2>
              <p className="text-sm text-text-secondary">
                Configure um ciclo por quarter para rastrear checklist, agenda e participantes.
              </p>
            </div>
            <Button onClick={openCreateCycleModal}>
              <Plus className="mr-2 h-4 w-4" />
              Novo planning cycle
            </Button>
          </div>

          {cyclesQuery.isLoading ? (
            <Card className="p-6">
              <AnimatedEmptyState
                icon={<AnimatedIllustration type="search" />}
                title="Carregando cycles"
                description="Buscando ciclos cadastrados para este tenant."
              />
            </Card>
          ) : cycles.length === 0 ? (
            <Card className="p-6">
              <AnimatedEmptyState
                icon={<AnimatedIllustration type="empty" />}
                title="Nenhum planning cycle"
                description="Crie o primeiro ciclo para conectar discovery e planejamento."
                action={
                  <Button variant="gradient" onClick={openCreateCycleModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar planning cycle
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {cycles.map((cycle) => (
                <Card key={cycle.id} variant="outline" className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs uppercase tracking-wide text-text-muted">
                        Quarter
                      </span>
                      <h3 className="text-xl font-semibold text-text-primary">{cycle.quarter}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <Badge
                          variant={resolvePlanningCycleStatusVariant(
                            cycle.statusMetadata ?? null,
                            cycle.statusSlug,
                          )}
                        >
                          {cycle.statusLabel ?? cycle.status}
                        </Badge>
                        <span className="text-sm text-text-secondary">
                          Fase atual: {cycle.faseAtual}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditCycleModal(cycle)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover planning cycle</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação remove definitivamente o ciclo selecionado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCycle(cycle.id)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Card variant="ghost" className="border border-dashed p-4">
                      <p className="text-xs uppercase text-text-muted">Checklist</p>
                      {cycle.checklist && cycle.checklist.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {cycle.checklist.map((item) => (
                            <li key={item.chave}>
                              <span className="font-medium">{item.label}</span>{' '}
                              <span className="text-text-muted">({item.chave})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-text-secondary">Nenhum item cadastrado.</p>
                      )}
                    </Card>
                    <Card variant="ghost" className="border border-dashed p-4">
                      <p className="text-xs uppercase text-text-muted">Agenda & participantes</p>
                      <p className="mt-2 text-sm text-text-secondary">
                        Agenda:{' '}
                        {cycle.agendaUrl ? (
                          <a
                            href={cycle.agendaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 underline"
                          >
                            Link
                          </a>
                        ) : (
                          '—'
                        )}
                      </p>
                      <p className="text-sm text-text-secondary">
                        Participantes confirmados: {cycle.participantesConfirmados ?? '—'}
                      </p>
                      <p className="text-sm text-text-secondary">
                        Participantes totais: {cycle.participantesTotais ?? '—'}
                      </p>
                    </Card>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={isSquadModalOpen}
        onOpenChange={(open) => (open ? setSquadModalOpen(true) : closeSquadModal())}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSquad ? 'Editar squad' : 'Novo squad'}</DialogTitle>
            <DialogDescription>
              Defina as informações básicas para usar o squad em épicos e capacidade.
            </DialogDescription>
          </DialogHeader>
          <Form {...squadForm}>
            <form onSubmit={squadForm.handleSubmit(handleSubmitSquad)} className="space-y-4">
              <FormField
                control={squadForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Squad Alpha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={squadForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="squad-alpha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={squadForm.control}
                name="produtoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto/frente</FormLabel>
                    <FormControl>
                      <Input placeholder="ID do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={squadForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Breve descrição do squad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={squadForm.control}
                  name="capacidadePadrao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade padrão (pts)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 360" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={squadForm.control}
                  name="statusSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                          onBlur={field.onBlur}
                          disabled={squadStatusCatalog.isLoading}
                        >
                          {squadStatusOptions.length === 0 ? (
                            <option value="">Carregando status...</option>
                          ) : null}
                          {squadStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" type="button" onClick={closeSquadModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSavingSquad}>
                  {isSavingSquad && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar squad
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCycleModalOpen}
        onOpenChange={(open) => (open ? setCycleModalOpen(true) : closeCycleModal())}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? 'Editar planning cycle' : 'Novo planning cycle'}
            </DialogTitle>
            <DialogDescription>
              Configure o checklist e os detalhes do ciclo trimestral de planejamento.
            </DialogDescription>
          </DialogHeader>
          <Form {...cycleForm}>
            <form onSubmit={cycleForm.handleSubmit(handleSubmitCycle)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={cycleForm.control}
                  name="quarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quarter</FormLabel>
                      <FormControl>
                        <select
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                          disabled={Boolean(editingCycle)}
                        >
                          {AVAILABLE_QUARTERS.map((quarter) => (
                            <option key={quarter} value={quarter}>
                              {quarter}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={cycleForm.control}
                  name="produtoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ID do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={cycleForm.control}
                  name="agendaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link da agenda</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={cycleForm.control}
                  name="participantesTotais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participantes (total)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={cycleForm.control}
                  name="participantesConfirmados"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participantes confirmados</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="18" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={cycleForm.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas / dados adicionais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações ou JSON com metadados para o ciclo"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>Checklist de readiness</FormLabel>
                    <p className="text-sm text-text-secondary">
                      Itens marcados servirão como checklist obrigatório antes do commitment.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      checklistFieldArray.append({ chave: '', label: '', responsavel: '' })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Item
                  </Button>
                </div>

                {checklistFieldArray.fields.length === 0 ? (
                  <p className="mt-2 text-sm text-text-muted">Nenhum item adicionado.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {checklistFieldArray.fields.map((field, index) => (
                      <Card key={field.id} variant="outline" className="border-dashed p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Item #{index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => checklistFieldArray.remove(index)}
                            className="text-destructive"
                          >
                            Remover
                          </Button>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <FormField
                            control={cycleForm.control}
                            name={`checklist.${index}.chave`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chave</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: backlog" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={cycleForm.control}
                            name={`checklist.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Input placeholder="Backlog priorizado" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={cycleForm.control}
                            name={`checklist.${index}.responsavel`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Responsável</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome / papel" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" type="button" onClick={closeCycleModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSavingCycle}>
                  {isSavingCycle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar planning cycle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
