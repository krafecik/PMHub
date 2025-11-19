'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DocumentoRegraNegocio } from '@/types/documentacao'

const schema = z.object({
  codigo: z.string().min(3, 'Informe o código da regra (ex: RN001)'),
  titulo: z.string().min(3, 'Informe o título da regra'),
  descricao: z.string().optional(),
  tipo: z.string().min(1, 'Selecione o tipo'),
  origem: z.string().min(1, 'Selecione a origem'),
  impacto: z.string().min(1, 'Informe o impacto'),
  modulo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ModalRegraNegocioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (valor: DocumentoRegraNegocio) => void
  initialData?: DocumentoRegraNegocio
}

const TIPOS = [
  { value: 'FISCAL', label: 'Fiscal' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OPERACIONAL', label: 'Operacional' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'OUTRO', label: 'Outro' },
]

const ORIGENS = [
  { value: 'LEGISLACAO', label: 'Legislação' },
  { value: 'REGRA_INTERNA', label: 'Regra interna' },
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'MERCADO', label: 'Mercado' },
  { value: 'OUTRA', label: 'Outra' },
]

const IMPACTOS = [
  { value: 'ALTO', label: 'Alto' },
  { value: 'MEDIO', label: 'Médio' },
  { value: 'BAIXO', label: 'Baixo' },
]

export function ModalRegraNegocio({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: ModalRegraNegocioProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ?? {
      codigo: '',
      titulo: '',
      descricao: '',
      tipo: 'OPERACIONAL',
      origem: 'REGRA_INTERNA',
      impacto: 'MEDIO',
      modulo: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        initialData ?? {
          codigo: '',
          titulo: '',
          descricao: '',
          tipo: 'OPERACIONAL',
          origem: 'REGRA_INTERNA',
          impacto: 'MEDIO',
          modulo: '',
        },
      )
    }
  }, [open, initialData, form])

  function handleSubmit(values: FormValues) {
    onSubmit({
      ...initialData,
      ...values,
    })
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Regra de Negócio' : 'Adicionar Regra de Negócio'}
          </DialogTitle>
          <DialogDescription>
            Estruture as regras de negócio em um formato padronizado para garantir rastreabilidade e
            clareza.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Código</label>
              <Input {...form.register('codigo')} placeholder="RN001" />
              {form.formState.errors.codigo && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.codigo.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <Input {...form.register('titulo')} placeholder="Regra para nota fiscal de saída" />
              {form.formState.errors.titulo && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.titulo.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <Textarea
              {...form.register('descricao')}
              placeholder="Descreva a regra com todos os detalhes necessários..."
              className="h-28"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <Select
                value={form.watch('tipo')}
                onValueChange={(value) => form.setValue('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Origem</label>
              <Select
                value={form.watch('origem')}
                onValueChange={(value) => form.setValue('origem', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Impacto</label>
              <Select
                value={form.watch('impacto')}
                onValueChange={(value) => form.setValue('impacto', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {IMPACTOS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Módulo</label>
            <Input
              {...form.register('modulo')}
              placeholder="Ex.: Faturamento, CRM, App Mobile..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">{initialData ? 'Salvar alterações' : 'Adicionar regra'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}
