'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { createProduto, Produto } from '@/lib/products-api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const criarProdutoSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

type CriarProdutoFormValues = z.infer<typeof criarProdutoSchema>

interface ModalCriarProdutoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (produtoId: string) => void
  editingProduto?: Produto | null
}

export function ModalCriarProduto({
  open,
  onOpenChange,
  onSuccess,
  editingProduto,
}: ModalCriarProdutoProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CriarProdutoFormValues>({
    resolver: zodResolver(criarProdutoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      status: 'ACTIVE',
    },
  })

  // Preencher formulário quando estiver editando
  React.useEffect(() => {
    if (editingProduto) {
      reset({
        nome: editingProduto.nome,
        descricao: editingProduto.descricao || '',
        status: (editingProduto.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
      })
    } else {
      reset({
        nome: '',
        descricao: '',
        status: 'ACTIVE',
      })
    }
  }, [editingProduto, reset, open])

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: CriarProdutoFormValues) => {
      if (editingProduto) {
        const { updateProduto } = await import('@/lib/products-api')
        return updateProduto(editingProduto.id, values)
      } else {
        return createProduto(values)
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({
        title: editingProduto ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!',
        description: editingProduto
          ? `Produto "${data.nome}" foi atualizado.`
          : `Produto "${data.nome}" foi criado e está pronto para uso.`,
      })
      reset()
      onOpenChange(false)
      onSuccess?.(data.id)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : editingProduto
            ? 'Ocorreu um erro ao atualizar o produto. Tente novamente.'
            : 'Ocorreu um erro ao criar o produto. Tente novamente.'
      toast({
        title: editingProduto ? 'Erro ao atualizar produto' : 'Erro ao criar produto',
        description: message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutate(values)
  })

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
                  className="w-full max-w-2xl"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                >
                  <div className="flex flex-col rounded-lg border border-border bg-background shadow-xl">
                    <div className="border-b p-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-2xl font-semibold text-text-primary">
                          {editingProduto ? 'Editar Produto' : 'Novo Produto'}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    <form
                      id="criar-produto-form"
                      onSubmit={onSubmit}
                      className="flex-1 space-y-6 overflow-y-auto p-6"
                    >
                      {/* Nome */}
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Produto *</Label>
                        <Input
                          id="nome"
                          placeholder="Ex: ERP Core, CRM, Fiscal"
                          error={!!errors.nome}
                          {...register('nome')}
                        />
                        {errors.nome && (
                          <p className="text-error-DEFAULT text-xs">{errors.nome.message}</p>
                        )}
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
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
                          <option value="ACTIVE">Ativo</option>
                          <option value="INACTIVE">Inativo</option>
                        </select>
                        {errors.status && (
                          <p className="text-error-DEFAULT text-xs">{errors.status.message}</p>
                        )}
                      </div>

                      {/* Descrição (opcional) */}
                      <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição (opcional)</Label>
                        <Textarea
                          id="descricao"
                          placeholder="Descreva brevemente o propósito deste produto..."
                          rows={3}
                          error={!!errors.descricao}
                          {...register('descricao')}
                        />
                        {errors.descricao && (
                          <p className="text-error-DEFAULT text-xs">{errors.descricao.message}</p>
                        )}
                      </div>
                    </form>

                    {/* Footer fixo */}
                    <div className="border-t bg-background p-6">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onOpenChange(false)}
                          disabled={isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          form="criar-produto-form"
                          variant="gradient"
                          disabled={isPending}
                          loading={isPending}
                        >
                          {editingProduto ? 'Salvar alterações' : 'Criar Produto'}
                        </Button>
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
