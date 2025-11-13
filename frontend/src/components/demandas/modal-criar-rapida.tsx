'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { TipoDemanda, tipoDemandaLabels } from '@/lib/enums'
import { criarDemandaRapida, CriarDemandaRapidaPayload } from '@/lib/demandas-api'
import { fetchProdutos } from '@/lib/products-api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const criarDemandaSchema = z.object({
  titulo: z
    .string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres'),
  tipo: z.nativeEnum(TipoDemanda),
  produtoId: z.string().min(1, 'Selecione um produto'),
  descricao: z.string().max(5000, 'Descrição deve ter no máximo 5000 caracteres').optional(),
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

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CriarDemandaFormValues>({
    resolver: zodResolver(criarDemandaSchema),
    defaultValues: {
      tipo: TipoDemanda.IDEIA,
      titulo: '',
      produtoId: '',
      descricao: '',
    },
  })

  const tipoSelecionado = watch('tipo')

  const { mutate, isPending } = useMutation({
    mutationFn: criarDemandaRapida,
    onSuccess: (data) => {
      toast({
        title: 'Demanda criada com sucesso!',
        description: `Demanda #${data.id} foi criada e está pronta para triagem.`,
      })
      reset()
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
    mutate(values as CriarDemandaRapidaPayload)
  })

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
                className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
              >
                <div className="rounded-lg border border-border bg-background p-6 shadow-xl">
                  <div className="mb-6 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-text-primary">
                      Nova Demanda
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </Dialog.Close>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-5">
                    {/* Tipo de Demanda */}
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(tipoDemandaLabels).map(([value, label]) => (
                          <label
                            key={value}
                            className={cn(
                              'flex cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-2.5 transition-all',
                              'hover:border-primary-200 hover:bg-secondary-50',
                              tipoSelecionado === value
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-border',
                            )}
                          >
                            <input
                              type="radio"
                              value={value}
                              {...register('tipo')}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        placeholder="Descreva brevemente a demanda..."
                        error={!!errors.titulo}
                        {...register('titulo')}
                      />
                      {errors.titulo && (
                        <p className="text-error-DEFAULT text-xs">{errors.titulo.message}</p>
                      )}
                    </div>

                    {/* Produto */}
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
                        <option value="">Selecione o produto...</option>
                        {produtos?.map((produto) => (
                          <option key={produto.id} value={produto.id}>
                            {produto.nome}
                          </option>
                        ))}
                      </select>
                      {errors.produtoId && (
                        <p className="text-error-DEFAULT text-xs">{errors.produtoId.message}</p>
                      )}
                    </div>

                    {/* Descrição (opcional) */}
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição rápida (opcional)</Label>
                      <Textarea
                        id="descricao"
                        placeholder="Adicione mais contexto se necessário..."
                        rows={3}
                        {...register('descricao')}
                      />
                      {errors.descricao && (
                        <p className="text-error-DEFAULT text-xs">{errors.descricao.message}</p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3 pt-2">
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
                        variant="gradient"
                        disabled={isPending}
                        loading={isPending}
                        className="flex-1"
                      >
                        Criar Demanda
                      </Button>
                    </div>
                  </form>

                  <div className="mt-4 text-center text-xs text-text-muted">
                    Tempo médio de criação: 30 segundos
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
