'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buscarDemandaPorId, atualizarDemanda, AtualizarDemandaPayload } from '@/lib/demandas-api'
import { fetchProdutos } from '@/lib/products-api'
import { useToast } from '@/hooks/use-toast'
import { FadeIn } from '@/components/motion'
import {
  TipoDemanda,
  OrigemDemanda,
  Prioridade,
  StatusDemanda,
  tipoDemandaLabels,
  origemDemandaLabels,
  prioridadeLabels,
  statusDemandaLabels,
} from '@/lib/enums'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

const atualizarDemandaSchema = z.object({
  titulo: z
    .string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres'),
  descricao: z.string().max(5000, 'Descrição deve ter no máximo 5000 caracteres').optional(),
  tipo: z.nativeEnum(TipoDemanda),
  origem: z.nativeEnum(OrigemDemanda).optional(),
  origemDetalhe: z.string().max(255, 'Origem detalhe deve ter no máximo 255 caracteres').optional(),
  prioridade: z.nativeEnum(Prioridade),
  responsavelId: z.string().optional().nullable(),
  status: z.nativeEnum(StatusDemanda),
})

type AtualizarDemandaFormValues = z.infer<typeof atualizarDemandaSchema>

export default function EditarDemandaPage() {
  const router = useRouter()
  const params = useParams()
  const demandaId = params.id as string
  const { toast } = useToast()
  const [hasChanges, setHasChanges] = useState(false)

  const { data: demanda, isLoading } = useQuery({
    queryKey: ['demanda', demandaId],
    queryFn: () => buscarDemandaPorId(demandaId),
  })

  const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: fetchProdutos,
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AtualizarDemandaFormValues>({
    resolver: zodResolver(atualizarDemandaSchema),
  })

  // Preencher o formulário com os dados da demanda
  useEffect(() => {
    if (demanda) {
      reset({
        titulo: demanda.titulo,
        descricao: demanda.descricao || '',
        tipo: demanda.tipo as TipoDemanda,
        origem: demanda.origem as OrigemDemanda,
        origemDetalhe: demanda.origemDetalhe || '',
        prioridade: demanda.prioridade as Prioridade,
        responsavelId: demanda.responsavelId || null,
        status: demanda.status as StatusDemanda,
      })
    }
  }, [demanda, reset])

  // Detectar mudanças no formulário
  const watchedValues = watch()
  const debouncedValues = useDebounce(watchedValues, 1000)

  useEffect(() => {
    if (demanda) {
      const hasFormChanges =
        watchedValues.titulo !== demanda.titulo ||
        watchedValues.descricao !== (demanda.descricao || '') ||
        watchedValues.tipo !== demanda.tipo ||
        watchedValues.origem !== demanda.origem ||
        watchedValues.origemDetalhe !== (demanda.origemDetalhe || '') ||
        watchedValues.prioridade !== demanda.prioridade ||
        watchedValues.responsavelId !== (demanda.responsavelId || null) ||
        watchedValues.status !== demanda.status

      setHasChanges(hasFormChanges)
    }
  }, [watchedValues, demanda])

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: (values: AtualizarDemandaFormValues) => {
      const payload: AtualizarDemandaPayload = {
        titulo: values.titulo,
        descricao: values.descricao || undefined,
        tipo: values.tipo,
        origem: values.origem,
        origemDetalhe: values.origemDetalhe || undefined,
        prioridade: values.prioridade,
        responsavelId: values.responsavelId === null ? null : values.responsavelId,
        status: values.status,
      }
      return atualizarDemanda(demandaId, payload)
    },
    onSuccess: () => {
      toast({
        title: 'Demanda atualizada',
        description: 'As alterações foram salvas com sucesso.',
      })
      setHasChanges(false)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Ocorreu um erro ao salvar as alterações.'
      toast({
        title: 'Erro ao atualizar demanda',
        description: message,
        variant: 'destructive',
      })
    },
  })

  // Autosave
  useEffect(() => {
    if (hasChanges && debouncedValues) {
      const isValid = atualizarDemandaSchema.safeParse(debouncedValues)
      if (isValid.success) {
        salvar(debouncedValues as AtualizarDemandaFormValues)
      }
    }
  }, [debouncedValues, hasChanges, salvar])

  const onSubmit = handleSubmit((values) => {
    salvar(values)
  })

  if (isLoading || !demanda) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-sm text-text-muted">Carregando demanda...</p>
        </div>
      </div>
    )
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Editar Demanda #{demandaId}</h1>
              <p className="mt-1 text-sm text-text-secondary">
                {hasChanges ? 'Salvando automaticamente...' : 'Todas as alterações foram salvas'}
              </p>
            </div>
          </div>
          <Button
            variant="gradient"
            onClick={onSubmit}
            disabled={isPending || !hasChanges}
            loading={isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar alterações
          </Button>
        </div>

        {/* Formulário */}
        <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-2">
          <Card variant="elevated" className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
              <CardDescription>Dados principais da demanda</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" error={!!errors.titulo} {...register('titulo')} />
                {errors.titulo && (
                  <p className="text-error-DEFAULT text-xs">{errors.titulo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  {...register('tipo')}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                    'text-sm ring-offset-background file:border-0 file:bg-transparent',
                    'file:text-sm file:font-medium placeholder:text-text-muted',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    errors.tipo && 'border-error-DEFAULT',
                  )}
                >
                  {Object.entries(tipoDemandaLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {Object.entries(statusDemandaLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  rows={5}
                  error={!!errors.descricao}
                  {...register('descricao')}
                />
                {errors.descricao && (
                  <p className="text-error-DEFAULT text-xs">{errors.descricao.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Origem e priorização</CardTitle>
              <CardDescription>De onde veio a demanda e sua importância</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="origem">Origem</Label>
                <select
                  id="origem"
                  {...register('origem')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(origemDemandaLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="origemDetalhe">Detalhe da origem</Label>
                <Input
                  id="origemDetalhe"
                  placeholder="Ex: Nome do cliente, área interna..."
                  {...register('origemDetalhe')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade *</Label>
                <select
                  id="prioridade"
                  {...register('prioridade')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {Object.entries(prioridadeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Atribuição</CardTitle>
              <CardDescription>Produto e responsável pela demanda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Input
                  value={produtos?.find((p) => p.id === demanda.produtoId)?.nome || 'Carregando...'}
                  disabled
                  className="opacity-60"
                />
                <p className="text-xs text-text-muted">
                  O produto não pode ser alterado após a criação
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavelId">Responsável</Label>
                <Input
                  id="responsavelId"
                  placeholder="ID do responsável (temporário)"
                  {...register('responsavelId')}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </FadeIn>
  )
}
