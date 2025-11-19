'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Clock,
  User,
  Tag,
  AlertCircle,
  Edit,
  ArrowRight,
  Save,
  XCircle,
  Users,
  TrendingUp,
  FileText,
  Lightbulb,
  FlaskConical,
  Search,
  Plus,
  X as XIcon,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import * as Tabs from '@radix-ui/react-tabs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  buscarDemandaPorId,
  atualizarDemanda,
  AtualizarDemandaPayload,
  adicionarTag,
  removerTag,
  cancelarDemanda,
} from '@/lib/demandas-api'
import { triarDemanda } from '@/lib/triagem-api'
import { obterDiscoveryPorDemandaId } from '@/lib/discovery-api'
import {
  StatusDemanda,
  tipoDemandaLabels,
  origemDemandaLabels,
  prioridadeLabels,
  statusDemandaLabels,
} from '@/lib/enums'
import { formatRelativeDate, cn } from '@/lib/utils'
import { Comentarios } from './comentarios'
import { AnexoUploader } from './anexo-uploader'
import { toast } from 'sonner'
import { DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'

const atualizarDemandaSchema = z.object({
  titulo: z
    .string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres'),
  descricao: z.string().max(50000, 'Descrição deve ter no máximo 50000 caracteres').optional(),
  tipo: z.string().min(1, 'Selecione o tipo'),
  origem: z.string().min(1, 'Selecione a origem').optional(),
  origemDetalhe: z
    .string()
    .max(255, 'Detalhe da origem deve ter no máximo 255 caracteres')
    .optional(),
  prioridade: z.string().min(1, 'Selecione a prioridade'),
  status: z.string().min(1, 'Selecione o status'),
})

type AtualizarDemandaFormValues = z.infer<typeof atualizarDemandaSchema>

interface DemandaDrawerProps {
  demandaId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  initialEditMode?: boolean
}

export function DemandaDrawer({
  demandaId,
  open,
  onOpenChange,
  initialEditMode = false,
}: DemandaDrawerProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMovingToTriagem, setIsMovingToTriagem] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(initialEditMode)
  const [novaTag, setNovaTag] = React.useState('')
  const [showCancelarModal, setShowCancelarModal] = React.useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = React.useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['demanda', demandaId],
    queryFn: () => buscarDemandaPorId(demandaId!),
    enabled: !!demandaId && open,
  })

  // Buscar Discovery associado à demanda
  const { data: discovery, isLoading: isLoadingDiscovery } = useQuery({
    queryKey: ['discovery', 'demanda', demandaId],
    queryFn: () => obterDiscoveryPorDemandaId(demandaId!),
    enabled: !!demandaId && open,
  })

  // Hooks para catálogos
  const { data: categoriaTipos } = useCatalogItemsBySlug('tipo_demanda', {
    includeInativos: false,
  })
  const { data: categoriaOrigens } = useCatalogItemsBySlug('origem_demanda', {
    includeInativos: false,
  })
  const { data: categoriaPrioridades } = useCatalogItemsBySlug('prioridade_nivel', {
    includeInativos: false,
  })
  const { data: categoriaStatus } = useCatalogItemsBySlug('status_demanda', {
    includeInativos: false,
  })

  // Formulário
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<AtualizarDemandaFormValues>({
    resolver: zodResolver(atualizarDemandaSchema),
  })

  // Função para normalizar valor da API para o formato esperado pelo select
  const normalizeValueForSelect = React.useCallback(
    (
      apiValue: string | undefined,
      categoriaItens?: Array<{ slug: string; metadata?: Record<string, unknown> | null }>,
    ): string => {
      if (!apiValue) return ''

      // Se temos catálogo, procura o item pelo slug e retorna legacyValue ou slug
      if (categoriaItens && categoriaItens.length > 0) {
        const item = categoriaItens.find(
          (item) => item.slug.toLowerCase() === apiValue.toLowerCase(),
        )
        if (item) {
          // Tenta pegar o legacyValue do metadata
          const legacyValue = item.metadata?.legacyValue as string | undefined
          if (legacyValue) {
            return legacyValue
          }
          // Se não tiver legacyValue, usa o slug
          return item.slug
        }
      }

      // Fallback: tenta converter para maiúsculas para usar com enums
      return apiValue.toUpperCase()
    },
    [],
  )

  // Opções dos selects
  const tipoOptions = React.useMemo(() => {
    if (categoriaTipos?.itens && categoriaTipos.itens.length > 0) {
      return categoriaTipos.itens
        .filter((item) => item.ativo)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((item) => ({
          value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
          label: item.label,
        }))
    }
    return Object.entries(tipoDemandaLabels).map(([value, label]) => ({ value, label }))
  }, [categoriaTipos])

  const origemOptions = React.useMemo(() => {
    if (categoriaOrigens?.itens && categoriaOrigens.itens.length > 0) {
      return categoriaOrigens.itens
        .filter((item) => item.ativo)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((item) => ({
          value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
          label: item.label,
        }))
    }
    return Object.entries(origemDemandaLabels).map(([value, label]) => ({ value, label }))
  }, [categoriaOrigens])

  const prioridadeOptions = React.useMemo(() => {
    if (categoriaPrioridades?.itens && categoriaPrioridades.itens.length > 0) {
      return categoriaPrioridades.itens
        .filter((item) => item.ativo)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((item) => ({
          value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
          label: item.label,
        }))
    }
    return Object.entries(prioridadeLabels).map(([value, label]) => ({ value, label }))
  }, [categoriaPrioridades])

  const statusOptions = React.useMemo(() => {
    if (categoriaStatus?.itens && categoriaStatus.itens.length > 0) {
      return categoriaStatus.itens
        .filter((item) => item.ativo)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((item) => ({
          value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
          label: item.label,
        }))
    }
    return Object.entries(statusDemandaLabels).map(([value, label]) => ({ value, label }))
  }, [categoriaStatus])

  // Valores normalizados para os selects (garantir que correspondam às opções)
  const normalizedTipo = React.useMemo(() => {
    if (!data?.tipo) return undefined
    const normalized = normalizeValueForSelect(
      data.tipo,
      categoriaTipos?.itens?.filter((item) => item.ativo),
    )
    // Verifica se o valor normalizado existe nas opções
    return tipoOptions.some((opt) => opt.value === normalized) ? normalized : undefined
  }, [data?.tipo, normalizeValueForSelect, categoriaTipos, tipoOptions])

  const normalizedStatus = React.useMemo(() => {
    if (!data?.status) return undefined
    const normalized = normalizeValueForSelect(
      data.status,
      categoriaStatus?.itens?.filter((item) => item.ativo),
    )
    return statusOptions.some((opt) => opt.value === normalized) ? normalized : undefined
  }, [data?.status, normalizeValueForSelect, categoriaStatus, statusOptions])

  const normalizedPrioridade = React.useMemo(() => {
    if (!data?.prioridade) return undefined
    const normalized = normalizeValueForSelect(
      data.prioridade,
      categoriaPrioridades?.itens?.filter((item) => item.ativo),
    )
    return prioridadeOptions.some((opt) => opt.value === normalized) ? normalized : undefined
  }, [data?.prioridade, normalizeValueForSelect, categoriaPrioridades, prioridadeOptions])

  const normalizedOrigem = React.useMemo(() => {
    if (!data?.origem) return undefined
    const normalized = normalizeValueForSelect(
      data.origem,
      categoriaOrigens?.itens?.filter((item) => item.ativo),
    )
    return origemOptions.some((opt) => opt.value === normalized) ? normalized : undefined
  }, [data?.origem, normalizeValueForSelect, categoriaOrigens, origemOptions])

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (
      data &&
      normalizedTipo !== undefined &&
      normalizedStatus !== undefined &&
      normalizedPrioridade !== undefined
    ) {
      const normalizedValues = {
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipo: normalizedTipo || '',
        origem: normalizedOrigem || '',
        origemDetalhe: data.origemDetalhe || '',
        prioridade: normalizedPrioridade || '',
        status: normalizedStatus || '',
      }

      reset(normalizedValues, { keepDefaultValues: false })
    }
  }, [data, reset, normalizedTipo, normalizedStatus, normalizedPrioridade, normalizedOrigem])

  // Atualizar valores dos selects quando os valores normalizados mudarem (especialmente importante quando já está em modo de edição)
  useEffect(() => {
    if (isEditing && normalizedTipo !== undefined) {
      if (normalizedTipo) setValue('tipo', normalizedTipo, { shouldDirty: false })
      if (normalizedStatus) setValue('status', normalizedStatus, { shouldDirty: false })
      if (normalizedPrioridade) setValue('prioridade', normalizedPrioridade, { shouldDirty: false })
      if (normalizedOrigem) setValue('origem', normalizedOrigem, { shouldDirty: false })
    }
  }, [
    isEditing,
    normalizedTipo,
    normalizedStatus,
    normalizedPrioridade,
    normalizedOrigem,
    setValue,
  ])

  // Mutation para adicionar tag
  const { mutate: adicionarTagMutation, isPending: isAddingTag } = useMutation({
    mutationFn: async (tagNome: string) => {
      return adicionarTag(demandaId!, tagNome)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demanda', demandaId] })
      setNovaTag('')
      toast.success('Tag adicionada com sucesso')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar tag'
      toast.error(message)
    },
  })

  // Mutation para remover tag
  const { mutate: removerTagMutation, isPending: isRemovingTag } = useMutation({
    mutationFn: async (tagId: string) => {
      return removerTag(demandaId!, tagId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demanda', demandaId] })
      toast.success('Tag removida com sucesso')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao remover tag'
      toast.error(message)
    },
  })

  // Mutation para cancelar demanda
  const { mutate: cancelarDemandaMutation, isPending: isCanceling } = useMutation({
    mutationFn: async (motivo: string) => {
      return cancelarDemanda(demandaId!, motivo)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demanda', demandaId] })
      queryClient.invalidateQueries({ queryKey: ['demandas'] })
      setShowCancelarModal(false)
      setMotivoCancelamento('')
      toast.success('Demanda cancelada com sucesso')
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar demanda'
      toast.error(message)
    },
  })

  // Mutation para salvar
  const { mutate: salvar, isPending: isSaving } = useMutation({
    mutationFn: async (values: AtualizarDemandaFormValues) => {
      if (!data) throw new Error('Demanda não encontrada')
      const payload: AtualizarDemandaPayload = {
        titulo: values.titulo,
        descricao: values.descricao || undefined,
        tipo: values.tipo,
        origem: values.origem || undefined,
        origemDetalhe: values.origemDetalhe || undefined,
        prioridade: values.prioridade,
        status: values.status as StatusDemanda,
      }
      return atualizarDemanda(data.id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demanda', demandaId] })
      queryClient.invalidateQueries({ queryKey: ['demandas'] })
      setIsEditing(false)
      toast.success('Demanda atualizada com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a demanda.')
    },
  })

  const onSubmit = (values: AtualizarDemandaFormValues) => {
    salvar(values)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (data) {
      reset({
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipo: normalizeValueForSelect(
          data.tipo,
          categoriaTipos?.itens?.filter((item) => item.ativo),
        ),
        origem:
          normalizeValueForSelect(
            data.origem,
            categoriaOrigens?.itens?.filter((item) => item.ativo),
          ) || '',
        origemDetalhe: data.origemDetalhe || '',
        prioridade: normalizeValueForSelect(
          data.prioridade,
          categoriaPrioridades?.itens?.filter((item) => item.ativo),
        ),
        status: normalizeValueForSelect(
          data.status,
          categoriaStatus?.itens?.filter((item) => item.ativo),
        ),
      })
    }
    setIsEditing(false)
  }

  // Resetar modo de edição quando o drawer fechar ou quando initialEditMode mudar
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    } else if (initialEditMode) {
      setIsEditing(true)
    }
  }, [open, initialEditMode])

  const handleMoverParaTriagem = async () => {
    if (!data) return

    try {
      setIsMovingToTriagem(true)

      // 1. Atualizar status da demanda para TRIAGEM
      await atualizarDemanda(data.id, {
        status: StatusDemanda.TRIAGEM,
      })

      // 2. Criar/atualizar registro de triagem com status PENDENTE_TRIAGEM
      // O comando triarDemanda cria automaticamente a triagem se não existir
      await triarDemanda(data.id, {
        novoStatus: 'PENDENTE_TRIAGEM',
      })

      // Invalidar queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['demanda', demandaId] })
      await queryClient.invalidateQueries({ queryKey: ['demandas'] })
      await queryClient.invalidateQueries({ queryKey: ['triagem'] })

      // Fechar o drawer primeiro
      onOpenChange(false)

      // Mostrar mensagem de sucesso
      toast.success('Demanda movida para triagem com sucesso!')

      // Redirecionar para a página de triagem após um pequeno delay
      setTimeout(() => {
        router.push('/triagem')
      }, 300)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível mover a demanda para triagem.',
      )
    } finally {
      setIsMovingToTriagem(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-background/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onOpenChange(false)}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild>
              <motion.div
                className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l bg-background shadow-xl"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <VisuallyHidden>
                  <DialogTitle>Detalhes da Demanda</DialogTitle>
                  <DialogDescription>
                    Visualize e gerencie os detalhes da demanda selecionada
                  </DialogDescription>
                </VisuallyHidden>
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                      <p className="text-sm text-text-muted">Carregando detalhes...</p>
                    </div>
                  </div>
                ) : data ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
                    {/* Header */}
                    <div className="border-b px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2 text-sm text-text-muted">
                            <span>#{data.id}</span>
                            {!isEditing && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs">
                                  {data.tipoLabel}
                                </Badge>
                              </>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                {...register('titulo')}
                                error={!!errors.titulo}
                                className="text-xl font-semibold"
                                placeholder="Título da demanda"
                              />
                              {errors.titulo && (
                                <p className="text-error-DEFAULT text-xs">
                                  {errors.titulo.message}
                                </p>
                              )}
                            </div>
                          ) : (
                            <h2 className="truncate text-xl font-semibold text-text-primary">
                              {data.titulo}
                            </h2>
                          )}
                        </div>
                        <Dialog.Close asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      <Tabs.Root defaultValue="resumo" className="flex h-full flex-col">
                        <Tabs.List className="flex border-b px-6">
                          <Tabs.Trigger
                            value="resumo"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Resumo
                          </Tabs.Trigger>
                          <Tabs.Trigger
                            value="descricao-detalhada"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Descrição detalhada
                          </Tabs.Trigger>
                          <Tabs.Trigger
                            value="contexto"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Contexto
                          </Tabs.Trigger>
                          <Tabs.Trigger
                            value="historico"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Histórico
                          </Tabs.Trigger>
                        </Tabs.List>

                        {/* Tab: Resumo */}
                        <Tabs.Content value="resumo" className="flex-1 space-y-6 p-6">
                          {/* Status e Info */}
                          <div className="space-y-4">
                            {isEditing ? (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="tipo">Tipo *</Label>
                                  <Select
                                    value={normalizedTipo || watch('tipo') || undefined}
                                    onValueChange={(value) => setValue('tipo', value)}
                                  >
                                    <SelectTrigger
                                      id="tipo"
                                      className={cn(errors.tipo && 'border-error-DEFAULT')}
                                    >
                                      <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tipoOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {errors.tipo && (
                                    <p className="text-error-DEFAULT text-xs">
                                      {errors.tipo.message}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="status">Status *</Label>
                                  <Select
                                    value={normalizedStatus || watch('status') || undefined}
                                    onValueChange={(value) => setValue('status', value)}
                                  >
                                    <SelectTrigger
                                      id="status"
                                      className={cn(errors.status && 'border-error-DEFAULT')}
                                    >
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {errors.status && (
                                    <p className="text-error-DEFAULT text-xs">
                                      {errors.status.message}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="prioridade">Prioridade *</Label>
                                  <Select
                                    value={normalizedPrioridade || watch('prioridade') || undefined}
                                    onValueChange={(value) => setValue('prioridade', value)}
                                  >
                                    <SelectTrigger
                                      id="prioridade"
                                      className={cn(errors.prioridade && 'border-error-DEFAULT')}
                                    >
                                      <SelectValue placeholder="Selecione a prioridade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {prioridadeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {errors.prioridade && (
                                    <p className="text-error-DEFAULT text-xs">
                                      {errors.prioridade.message}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="origem">Origem</Label>
                                  <Select
                                    value={normalizedOrigem || watch('origem') || ''}
                                    onValueChange={(value) => setValue('origem', value)}
                                  >
                                    <SelectTrigger
                                      id="origem"
                                      className={cn(errors.origem && 'border-error-DEFAULT')}
                                    >
                                      <SelectValue placeholder="Selecione a origem" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {origemOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {errors.origem && (
                                    <p className="text-error-DEFAULT text-xs">
                                      {errors.origem.message}
                                    </p>
                                  )}
                                </div>

                                {watch('origem') && (
                                  <div className="space-y-2">
                                    <Label htmlFor="origemDetalhe">Detalhe da Origem</Label>
                                    <Input
                                      id="origemDetalhe"
                                      {...register('origemDetalhe')}
                                      error={!!errors.origemDetalhe}
                                      placeholder="Detalhes adicionais sobre a origem"
                                    />
                                    {errors.origemDetalhe && (
                                      <p className="text-error-DEFAULT text-xs">
                                        {errors.origemDetalhe.message}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-text-secondary">
                                    Status
                                  </span>
                                  <Badge variant={data.status === 'NOVO' ? 'success' : 'secondary'}>
                                    {data.statusLabel}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-text-secondary">
                                    Prioridade
                                  </span>
                                  <Badge
                                    variant={
                                      data.prioridade === 'CRITICA'
                                        ? 'destructive'
                                        : data.prioridade === 'ALTA'
                                          ? 'warning'
                                          : data.prioridade === 'MEDIA'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                  >
                                    {data.prioridadeLabel}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-text-secondary">
                                    Origem
                                  </span>
                                  <span className="text-sm text-text-primary">
                                    {data.origemLabel}
                                  </span>
                                </div>
                                {data.origemDetalhe && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-text-secondary">
                                      Detalhe origem
                                    </span>
                                    <span className="text-sm text-text-primary">
                                      {data.origemDetalhe}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-text-secondary">Tags</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Nova tag..."
                                value={novaTag}
                                onChange={(e) => setNovaTag(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && novaTag.trim()) {
                                    e.preventDefault()
                                    adicionarTagMutation(novaTag.trim())
                                  }
                                }}
                                className="h-8 flex-1 text-xs"
                                disabled={isAddingTag || data.status === 'arquivado'}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (novaTag.trim()) {
                                    adicionarTagMutation(novaTag.trim())
                                  }
                                }}
                                disabled={
                                  !novaTag.trim() || isAddingTag || data.status === 'arquivado'
                                }
                                className="h-8 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {data.tags && data.tags.length > 0 ? (
                                data.tags.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="flex items-center gap-1 text-xs"
                                  >
                                    <Tag className="h-3 w-3" />
                                    {tag.nome}
                                    {data.status !== 'arquivado' && (
                                      <button
                                        type="button"
                                        onClick={() => removerTagMutation(tag.id)}
                                        disabled={isRemovingTag}
                                        className="hover:text-error-DEFAULT ml-1 transition-colors"
                                        title="Remover tag"
                                      >
                                        <XIcon className="h-3 w-3" />
                                      </button>
                                    )}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-xs text-text-muted">Nenhuma tag adicionada</p>
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Anexos */}
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-text-secondary">Anexos</h3>
                            <AnexoUploader demandaId={data.id} />
                          </div>

                          {/* Meta info */}
                          <div className="space-y-2 pt-4 text-xs text-text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Criado {formatRelativeDate(data.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                Por {data.criadoPorNome || `usuário #${data.criadoPorId}`}
                              </span>
                            </div>
                            {data.motivoCancelamento && (
                              <div className="border-error-200 bg-error-50 mt-3 rounded-lg border p-3">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="text-error-600 mt-0.5 h-4 w-4" />
                                  <div className="flex-1">
                                    <p className="text-error-900 mb-1 text-xs font-medium">
                                      Motivo do cancelamento:
                                    </p>
                                    <p className="text-error-700 whitespace-pre-wrap text-xs">
                                      {data.motivoCancelamento}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Tabs.Content>

                        {/* Tab: Descrição detalhada */}
                        <Tabs.Content
                          value="descricao-detalhada"
                          className="flex-1 overflow-y-auto p-6"
                        >
                          <div className="space-y-6">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição (opcional)</Label>
                                <RichTextEditor
                                  content={watch('descricao') || ''}
                                  onChange={(content) =>
                                    setValue('descricao', content, { shouldDirty: true })
                                  }
                                  placeholder="Use formatação rica, imagens e links para descrever a demanda em detalhes..."
                                  error={!!errors.descricao}
                                />
                                {errors.descricao && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.descricao.message}
                                  </p>
                                )}
                              </div>
                            ) : data.descricao ? (
                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-text-secondary">
                                  Descrição detalhada
                                </h3>
                                <div
                                  className="prose prose-sm max-w-none text-text-primary"
                                  dangerouslySetInnerHTML={{ __html: data.descricao }}
                                />
                              </div>
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center text-center">
                                <p className="text-sm text-text-muted">
                                  Nenhuma descrição detalhada adicionada ainda.
                                </p>
                              </div>
                            )}
                          </div>
                        </Tabs.Content>

                        {/* Tab: Contexto */}
                        <Tabs.Content value="contexto" className="flex-1 overflow-y-auto p-6">
                          {isLoadingDiscovery ? (
                            <div className="flex h-full items-center justify-center">
                              <div className="space-y-2 text-center">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                                <p className="text-sm text-text-muted">Carregando contexto...</p>
                              </div>
                            </div>
                          ) : discovery ? (
                            <div className="space-y-6">
                              {/* Informações do Discovery */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-text-primary">
                                    Discovery: {discovery.titulo}
                                  </h3>
                                  <Badge
                                    variant={discovery.status === 'FECHADO' ? 'success' : 'info'}
                                  >
                                    {discovery.statusLabel}
                                  </Badge>
                                </div>

                                {discovery.descricao && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-text-secondary">
                                      Descrição
                                    </h4>
                                    <p className="whitespace-pre-wrap text-sm text-text-primary">
                                      {discovery.descricao}
                                    </p>
                                  </div>
                                )}

                                {discovery.contexto && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-text-secondary">
                                      Contexto
                                    </h4>
                                    <p className="whitespace-pre-wrap text-sm text-text-primary">
                                      {discovery.contexto}
                                    </p>
                                  </div>
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                  {discovery.publicoAfetado &&
                                    discovery.publicoAfetado.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-text-muted" />
                                          <h4 className="text-sm font-medium text-text-secondary">
                                            Público Afetado
                                          </h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {discovery.publicoAfetado.map((publico, index) => (
                                            <Badge
                                              key={index}
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {publico}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  {discovery.volumeImpactado && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-text-muted" />
                                        <h4 className="text-sm font-medium text-text-secondary">
                                          Volume Impactado
                                        </h4>
                                      </div>
                                      <p className="text-sm text-text-primary">
                                        {discovery.volumeImpactado}
                                      </p>
                                    </div>
                                  )}

                                  {discovery.severidadeLabel && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium text-text-secondary">
                                        Severidade
                                      </h4>
                                      <Badge variant="warning">{discovery.severidadeLabel}</Badge>
                                    </div>
                                  )}

                                  {discovery.comoIdentificado &&
                                    discovery.comoIdentificado.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Search className="h-4 w-4 text-text-muted" />
                                          <h4 className="text-sm font-medium text-text-secondary">
                                            Como Identificado
                                          </h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {discovery.comoIdentificado.map(
                                            (identificacao, index) => (
                                              <Badge
                                                key={index}
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {identificacao}
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>

                                {/* Estatísticas do Discovery */}
                                <div className="grid gap-4 md:grid-cols-4">
                                  <div className="rounded-lg border bg-background p-4">
                                    <div className="flex items-center gap-2 text-text-muted">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-xs">Hipóteses</span>
                                    </div>
                                    <p className="mt-1 text-2xl font-semibold text-text-primary">
                                      {discovery.hipoteses?.length || 0}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border bg-background p-4">
                                    <div className="flex items-center gap-2 text-text-muted">
                                      <Search className="h-4 w-4" />
                                      <span className="text-xs">Pesquisas</span>
                                    </div>
                                    <p className="mt-1 text-2xl font-semibold text-text-primary">
                                      {discovery.pesquisas?.length || 0}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border bg-background p-4">
                                    <div className="flex items-center gap-2 text-text-muted">
                                      <Lightbulb className="h-4 w-4" />
                                      <span className="text-xs">Insights</span>
                                    </div>
                                    <p className="mt-1 text-2xl font-semibold text-text-primary">
                                      {discovery.insights?.length || 0}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border bg-background p-4">
                                    <div className="flex items-center gap-2 text-text-muted">
                                      <FlaskConical className="h-4 w-4" />
                                      <span className="text-xs">Experimentos</span>
                                    </div>
                                    <p className="mt-1 text-2xl font-semibold text-text-primary">
                                      {discovery.experimentos?.length || 0}
                                    </p>
                                  </div>
                                </div>

                                {/* Botão para ver Discovery completo */}
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => router.push(`/discovery/${discovery.id}` as any)}
                                >
                                  Ver Discovery Completo
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                              <AlertCircle className="mb-4 h-12 w-12 text-text-muted" />
                              <h3 className="mb-2 text-base font-medium text-text-primary">
                                Nenhum Discovery associado
                              </h3>
                              <p className="mb-6 max-w-sm text-sm text-text-secondary">
                                Esta demanda ainda não possui um Discovery. Crie um Discovery para
                                explorar o contexto, hipóteses e validações relacionadas.
                              </p>
                              <Button
                                variant="default"
                                onClick={() => router.push(`/discovery?demandaId=${demandaId}`)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Criar Discovery
                              </Button>
                            </div>
                          )}
                        </Tabs.Content>

                        {/* Tab: Histórico */}
                        <Tabs.Content value="historico" className="flex-1 overflow-y-auto">
                          <div className="p-6">
                            <Comentarios demandaId={data.id} />
                          </div>
                        </Tabs.Content>
                      </Tabs.Root>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={handleCancel}
                            disabled={isSaving}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            variant="default"
                            className="flex-1"
                            disabled={isSaving || !isDirty}
                            loading={isSaving}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {data.status !== 'arquivado' && (
                            <>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleMoverParaTriagem}
                                disabled={
                                  isMovingToTriagem || data.status === StatusDemanda.TRIAGEM
                                }
                                loading={isMovingToTriagem}
                              >
                                {data.status === StatusDemanda.TRIAGEM ? (
                                  <>
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Já está em Triagem
                                  </>
                                ) : (
                                  <>
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Mover para Triagem
                                  </>
                                )}
                              </Button>
                              <Button variant="default" className="flex-1" onClick={handleEdit}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => setShowCancelarModal(true)}
                                disabled={data.status === 'arquivado'}
                                className="flex-1 font-semibold text-white"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </form>
                ) : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>

      {/* Modal de Cancelamento */}
      <Dialog.Root open={showCancelarModal} onOpenChange={setShowCancelarModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/30 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Cancelar Demanda</DialogTitle>
              <DialogDescription>
                Informe o motivo do cancelamento. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo-cancelamento">Motivo do cancelamento *</Label>
                <Textarea
                  id="motivo-cancelamento"
                  placeholder="Descreva o motivo do cancelamento..."
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelarModal(false)
                  setMotivoCancelamento('')
                }}
                disabled={isCanceling}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (motivoCancelamento.trim()) {
                    cancelarDemandaMutation(motivoCancelamento.trim())
                  }
                }}
                disabled={!motivoCancelamento.trim() || isCanceling}
                loading={isCanceling}
                className="font-semibold text-white"
              >
                <Ban className="mr-2 h-4 w-4" />
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Dialog.Root>
  )
}
