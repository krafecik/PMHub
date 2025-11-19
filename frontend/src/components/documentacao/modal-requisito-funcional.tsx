'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DocumentoRequisitoFuncional } from '@/types/documentacao'
import * as Dialog from '@radix-ui/react-dialog'

const schema = z.object({
  codigo: z.string().min(3, 'Informe o código (ex: FUN-01)'),
  descricao: z.string().min(5, 'Descreva o requisito funcional'),
  prioridade: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ModalRequisitoFuncionalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (valor: DocumentoRequisitoFuncional) => void
  initialData?: DocumentoRequisitoFuncional
}

export function ModalRequisitoFuncional({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: ModalRequisitoFuncionalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ?? {
      codigo: '',
      descricao: '',
      prioridade: 'ALTA',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        initialData ?? {
          codigo: '',
          descricao: '',
          prioridade: 'ALTA',
        },
      )
    }
  }, [open, initialData, form])

  function handleSubmit(values: FormValues) {
    onSubmit({ ...initialData, ...values })
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Requisito Funcional' : 'Adicionar Requisito Funcional'}
          </DialogTitle>
          <DialogDescription>
            Liste os requisitos funcionais numerados para garantir clareza na execução e validação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Código</label>
              <Input {...form.register('codigo')} placeholder="FUN-01" />
              {form.formState.errors.codigo && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.codigo.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
              <Input {...form.register('prioridade')} placeholder="Alta / Média / Baixa" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <Textarea
              {...form.register('descricao')}
              placeholder="Descreva o comportamento funcional esperado..."
              className="h-32"
            />
            {form.formState.errors.descricao && (
              <p className="text-destructive mt-1 text-xs">
                {form.formState.errors.descricao.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">
              {initialData ? 'Salvar alterações' : 'Adicionar requisito'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}
