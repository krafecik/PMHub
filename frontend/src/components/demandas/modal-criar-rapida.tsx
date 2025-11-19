'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { motion, AnimatePresence } from 'framer-motion'
import {
  tipoDemandaLabels,
  origemDemandaLabels,
  prioridadeLabels,
  statusDemandaLabels,
} from '@/lib/enums'
import { criarDemandaRapida, CriarDemandaRapidaPayload } from '@/lib/demandas-api'
import { fetchProdutos } from '@/lib/products-api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { useListarUsuarios } from '@/hooks/use-usuarios'

type TipoOption = {
  value: string
  label: string
  descricao?: string
}

const criarDemandaSchema = z.object({
  titulo: z
    .string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres'),
  tipo: z.string().min(1, 'Selecione o tipo de demanda'),
  produtoId: z.string().min(1, 'Selecione um produto'),
  descricao: z.string().max(50000, 'Descrição deve ter no máximo 50000 caracteres').optional(),
  origem: z.string().min(1, 'Selecione a origem da demanda'),
  origemDetalhe: z
    .string()
    .max(255, 'Detalhe da origem deve ter no máximo 255 caracteres')
    .optional(),
  prioridade: z.string().min(1, 'Selecione a prioridade'),
  status: z.string().min(1, 'Selecione o status'),
  responsavelId: z.string().max(255, 'Responsável deve ter no máximo 255 caracteres').optional(),
})

type CriarDemandaFormValues = z.infer<typeof criarDemandaSchema>

interface ModalCriarRapidaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (demandaId: string) => void
}

export function ModalCriarRapida({ open, onOpenChange, onSuccess }: ModalCriarRapidaProps) {
  const { toast } = useToast()

  const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: fetchProdutos,
  })

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

  const { data: usuarios } = useListarUsuarios()

  const fallbackTipoOptions = React.useMemo<TipoOption[]>(
    () =>
      Object.entries(tipoDemandaLabels).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  )

  const catalogTipoOptions = React.useMemo<TipoOption[]>(() => {
    const itens = categoriaTipos?.itens ?? []
    return itens
      .filter((item) => item.ativo)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((item) => ({
        value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
        label: item.label,
        descricao: item.descricao ?? undefined,
      }))
  }, [categoriaTipos])

  const tipoOptions = catalogTipoOptions.length > 0 ? catalogTipoOptions : fallbackTipoOptions

  const fallbackOrigemOptions = React.useMemo(
    () =>
      Object.entries(origemDemandaLabels).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  )

  const fallbackPrioridadeOptions = React.useMemo(
    () =>
      Object.entries(prioridadeLabels).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  )

  const fallbackStatusOptions = React.useMemo(
    () =>
      Object.entries(statusDemandaLabels).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  )

  const catalogOrigemOptions = React.useMemo(() => {
    const itens = categoriaOrigens?.itens ?? []
    return itens
      .filter((item) => item.ativo)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((item) => ({
        value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
        label: item.label,
      }))
  }, [categoriaOrigens])

  const catalogPrioridadeOptions = React.useMemo(() => {
    const itens = categoriaPrioridades?.itens ?? []
    return itens
      .filter((item) => item.ativo)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((item) => ({
        value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
        label: item.label,
      }))
  }, [categoriaPrioridades])

  const catalogStatusOptions = React.useMemo(() => {
    const itens = categoriaStatus?.itens ?? []
    return itens
      .filter((item) => item.ativo)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((item) => ({
        value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
        label: item.label,
      }))
  }, [categoriaStatus])

  const origemOptions =
    catalogOrigemOptions.length > 0 ? catalogOrigemOptions : fallbackOrigemOptions
  const prioridadeOptions =
    catalogPrioridadeOptions.length > 0 ? catalogPrioridadeOptions : fallbackPrioridadeOptions
  const statusOptions =
    catalogStatusOptions.length > 0 ? catalogStatusOptions : fallbackStatusOptions

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CriarDemandaFormValues>({
    resolver: zodResolver(criarDemandaSchema),
    defaultValues: {
      tipo: '',
      titulo: '',
      produtoId: '',
      descricao: '',
      origem: '',
      origemDetalhe: '',
      prioridade: '',
      status: '',
      responsavelId: '',
    },
  })

  const tipoSelecionado = watch('tipo')
  const usuariosDisponiveis = React.useMemo(
    () => (usuarios ?? []).filter((usuario) => usuario.active),
    [usuarios],
  )

  const tipoDescricaoSelecionada = React.useMemo(() => {
    const option = tipoOptions.find((item) => item.value === tipoSelecionado)
    return option?.descricao
  }, [tipoOptions, tipoSelecionado])

  const { mutate, isPending } = useMutation({
    mutationFn: criarDemandaRapida,
    onSuccess: (data) => {
      toast({
        title: 'Demanda criada com sucesso!',
        description: `Demanda #${data.id} foi criada e está pronta para triagem.`,
      })
      reset()
      if (tipoOptions.length > 0) {
        setValue('tipo', tipoOptions[0].value, { shouldValidate: true })
      }
      if (origemOptions.length > 0) {
        setValue('origem', origemOptions[0].value, { shouldValidate: true })
      }
      if (prioridadeOptions.length > 0) {
        setValue('prioridade', prioridadeOptions[0].value, { shouldValidate: true })
      }
      if (statusOptions.length > 0) {
        setValue('status', statusOptions[0].value, { shouldValidate: true })
      }
      setValue('responsavelId', '', { shouldValidate: false })
      setValue('origemDetalhe', '', { shouldValidate: false })
      onOpenChange(false)
      onSuccess?.(data.id)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao criar a demanda. Tente novamente.'
      toast({
        title: 'Erro ao criar demanda',
        description: message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = handleSubmit((values) => {
    const payload: CriarDemandaRapidaPayload = {
      titulo: values.titulo,
      tipo: values.tipo,
      produtoId: values.produtoId,
      descricao: values.descricao?.trim() ? values.descricao.trim() : undefined,
      origem: values.origem,
      origemDetalhe: values.origemDetalhe?.trim() ? values.origemDetalhe.trim() : undefined,
      prioridade: values.prioridade,
      status: values.status,
      responsavelId: values.responsavelId?.trim() ? values.responsavelId.trim() : undefined,
    }

    mutate(payload)
  })

  React.useEffect(() => {
    if (tipoOptions.length === 0) {
      return
    }
    const currentValue = getValues('tipo')
    if (!currentValue || !tipoOptions.some((option) => option.value === currentValue)) {
      setValue('tipo', tipoOptions[0].value, { shouldValidate: true })
    }
  }, [tipoOptions, getValues, setValue])

  React.useEffect(() => {
    if (origemOptions.length === 0) {
      return
    }
    const currentValue = getValues('origem')
    if (!currentValue || !origemOptions.some((option) => option.value === currentValue)) {
      setValue('origem', origemOptions[0].value, { shouldValidate: true })
    }
  }, [origemOptions, getValues, setValue])

  React.useEffect(() => {
    if (prioridadeOptions.length === 0) {
      return
    }
    const currentValue = getValues('prioridade')
    if (!currentValue || !prioridadeOptions.some((option) => option.value === currentValue)) {
      setValue('prioridade', prioridadeOptions[0].value, { shouldValidate: true })
    }
  }, [prioridadeOptions, getValues, setValue])

  React.useEffect(() => {
    if (statusOptions.length === 0) {
      return
    }
    const currentValue = getValues('status')
    if (!currentValue || !statusOptions.some((option) => option.value === currentValue)) {
      setValue('status', statusOptions[0].value, { shouldValidate: true })
    }
  }, [statusOptions, getValues, setValue])

  const handleSaveAsDraft = () => {
    // Implementar salvamento como rascunho futuramente
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'O salvamento como rascunho será implementado em breve.',
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="h-[85vh] max-h-[800px] w-full max-w-4xl"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                >
                  <div className="flex h-full flex-col rounded-lg border border-border bg-background shadow-xl">
                    <div className="border-b p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Dialog.Title className="text-2xl font-semibold text-text-primary">
                            Nova Demanda
                          </Dialog.Title>
                          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                            Preencha as informações essenciais para abrir uma nova demanda e
                            enviá-la para triagem.
                          </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Fechar modal de criação rápida de demanda"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    <form
                      id="criar-demanda-form"
                      onSubmit={onSubmit}
                      className="flex-1 overflow-y-auto"
                    >
                      <Tabs.Root
                        defaultValue="informacoes-basicas"
                        className="flex h-full flex-col"
                      >
                        <Tabs.List className="flex border-b px-6">
                          <Tabs.Trigger
                            value="informacoes-basicas"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Informações básicas
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
                            value="classificacao-contexto"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Classificação e contexto
                          </Tabs.Trigger>
                          <Tabs.Trigger
                            value="atribuicao"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Atribuição
                          </Tabs.Trigger>
                        </Tabs.List>

                        {/* Tab: Informações básicas */}
                        <Tabs.Content
                          value="informacoes-basicas"
                          className="flex-1 overflow-y-auto p-6"
                        >
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Informações básicas
                              </p>
                              <p className="mt-1 text-xs text-text-muted">
                                Comece definindo os dados essenciais da demanda.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label>Tipo *</Label>
                                {tipoOptions.length > 0 ? (
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    {tipoOptions.map((option) => (
                                      <label
                                        key={option.value}
                                        className={cn(
                                          'flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-2.5 text-left transition-all',
                                          'hover:border-primary-200 hover:bg-secondary-50',
                                          tipoSelecionado === option.value
                                            ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                                            : 'border-border',
                                        )}
                                      >
                                        <span className="text-sm font-medium">{option.label}</span>
                                        <input
                                          type="radio"
                                          value={option.value}
                                          {...register('tipo')}
                                          className="sr-only"
                                        />
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                                    Nenhum tipo de demanda configurado. Acesse{' '}
                                    <span className="font-semibold">
                                      Configurações &gt; Catálogos flexíveis
                                    </span>{' '}
                                    para criar valores.
                                  </div>
                                )}
                                {tipoDescricaoSelecionada && (
                                  <p className="text-xs text-text-muted">
                                    {tipoDescricaoSelecionada}
                                  </p>
                                )}
                                {errors.tipo && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.tipo.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="titulo">Título *</Label>
                                <Input
                                  id="titulo"
                                  placeholder="Um nome claro para identificar a demanda"
                                  error={!!errors.titulo}
                                  {...register('titulo')}
                                />
                                {errors.titulo && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.titulo.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="produtoId">Produto *</Label>
                                <select
                                  id="produtoId"
                                  {...register('produtoId')}
                                  className={cn(
                                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                                    'text-sm ring-offset-background file:border-0 file:bg-transparent',
                                    'file:text-sm file:font-medium placeholder:text-text-muted',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                    errors.produtoId && 'border-error-DEFAULT',
                                  )}
                                >
                                  <option value="" disabled>
                                    Selecione o produto...
                                  </option>
                                  {produtos?.map((produto) => (
                                    <option key={produto.id} value={produto.id}>
                                      {produto.nome}
                                    </option>
                                  ))}
                                </select>
                                {errors.produtoId && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.produtoId.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Tabs.Content>

                        {/* Tab: Descrição detalhada */}
                        <Tabs.Content
                          value="descricao-detalhada"
                          className="flex-1 overflow-y-auto p-6"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="descricao">Descrição (opcional)</Label>
                            <RichTextEditor
                              content={watch('descricao') || ''}
                              onChange={(content) => setValue('descricao', content)}
                              placeholder="Compartilhe o contexto, métricas afetadas ou evidências relevantes..."
                              error={!!errors.descricao}
                            />
                            {errors.descricao && (
                              <p className="text-error-DEFAULT text-xs">
                                {errors.descricao.message}
                              </p>
                            )}
                          </div>
                        </Tabs.Content>

                        {/* Tab: Classificação e contexto */}
                        <Tabs.Content
                          value="classificacao-contexto"
                          className="flex-1 overflow-y-auto p-6"
                        >
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Classificação e contexto
                              </p>
                              <p className="mt-1 text-xs text-text-muted">
                                Informe origem, prioridade e status para orientar a triagem.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="origem">Origem *</Label>
                                {origemOptions.length > 0 ? (
                                  <select
                                    id="origem"
                                    {...register('origem')}
                                    className={cn(
                                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                                      'text-sm ring-offset-background file:border-0 file:bg-transparent',
                                      'file:text-sm file:font-medium placeholder:text-text-muted',
                                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                      'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                      errors.origem && 'border-error-DEFAULT',
                                    )}
                                  >
                                    <option value="" disabled>
                                      Selecione a origem...
                                    </option>
                                    {origemOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                                    Nenhuma origem configurada. Cadastre valores em Configurações
                                    &gt; Catálogos flexíveis.
                                  </div>
                                )}
                                {errors.origem && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.origem.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="prioridade">Prioridade *</Label>
                                {prioridadeOptions.length > 0 ? (
                                  <select
                                    id="prioridade"
                                    {...register('prioridade')}
                                    className={cn(
                                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                                      'text-sm ring-offset-background file:border-0 file:bg-transparent',
                                      'file:text-sm file:font-medium placeholder:text-text-muted',
                                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                      'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                      errors.prioridade && 'border-error-DEFAULT',
                                    )}
                                  >
                                    <option value="" disabled>
                                      Selecione a prioridade...
                                    </option>
                                    {prioridadeOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                                    Nenhuma prioridade configurada. Ajuste os catálogos flexíveis.
                                  </div>
                                )}
                                {errors.prioridade && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.prioridade.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="status">Status inicial *</Label>
                                {statusOptions.length > 0 ? (
                                  <select
                                    id="status"
                                    {...register('status')}
                                    className={cn(
                                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                                      'text-sm ring-offset-background file:border-0 file:bg-transparent',
                                      'file:text-sm file:font-medium placeholder:text-text-muted',
                                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                      'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                      errors.status && 'border-error-DEFAULT',
                                    )}
                                  >
                                    <option value="" disabled>
                                      Defina o status...
                                    </option>
                                    {statusOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                                    Nenhum status disponível. Verifique os catálogos flexíveis.
                                  </div>
                                )}
                                {errors.status && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.status.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="origemDetalhe">Detalhe da origem (opcional)</Label>
                                <Input
                                  id="origemDetalhe"
                                  placeholder="Ex: Nome do solicitante, canal, ticket ou referência relacionada"
                                  {...register('origemDetalhe')}
                                />
                                {errors.origemDetalhe && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.origemDetalhe.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Tabs.Content>

                        {/* Tab: Atribuição */}
                        <Tabs.Content value="atribuicao" className="flex-1 overflow-y-auto p-6">
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Atribuição
                              </p>
                              <p className="mt-1 text-xs text-text-muted">
                                Se já souber, indique quem acompanhará a demanda após a abertura.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="responsavelId">Responsável (opcional)</Label>
                                <select
                                  id="responsavelId"
                                  {...register('responsavelId')}
                                  className={cn(
                                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                                    'text-sm ring-offset-background file:border-0 file:bg-transparent',
                                    'file:text-sm file:font-medium placeholder:text-text-muted',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                    errors.responsavelId && 'border-error-DEFAULT',
                                  )}
                                >
                                  <option value="">Sem responsável definido agora</option>
                                  {usuariosDisponiveis.map((usuario) => (
                                    <option key={usuario.id} value={usuario.id}>
                                      {usuario.name}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-text-muted">
                                  Você pode atribuir um responsável depois em &ldquo;Editar
                                  demanda&rdquo;.
                                </p>
                                {errors.responsavelId && (
                                  <p className="text-error-DEFAULT text-xs">
                                    {errors.responsavelId.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Tabs.Content>
                      </Tabs.Root>
                    </form>

                    {/* Footer fixo */}
                    <div className="border-t bg-background p-6">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-muted">
                          Tempo médio de criação: 30 segundos
                        </p>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveAsDraft}
                            disabled={isPending}
                          >
                            Salvar rascunho
                          </Button>
                          <Button
                            type="submit"
                            form="criar-demanda-form"
                            variant="gradient"
                            disabled={isPending}
                            loading={isPending}
                          >
                            Criar Demanda
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
