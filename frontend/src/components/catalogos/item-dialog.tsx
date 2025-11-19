'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { CatalogCategory, CatalogItem } from '@/lib/catalogos-api'
import { useListarProdutos } from '@/hooks/use-produtos'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  label: z
    .string({ required_error: 'Informe o rótulo do item.' })
    .min(2, 'O rótulo deve ter pelo menos 2 caracteres.')
    .max(120, 'O rótulo deve ter no máximo 120 caracteres.'),
  slug: z
    .string()
    .max(120, 'O slug deve ter no máximo 120 caracteres.')
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : undefined)),
  descricao: z
    .string()
    .max(250, 'A descrição deve ter no máximo 250 caracteres.')
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : undefined)),
  ordem: z
    .number()
    .int('Informe um número inteiro.')
    .min(0, 'A ordem deve ser maior ou igual a 0.')
    .optional(),
  ativo: z.boolean().default(true),
  produtoId: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  metadata: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : undefined)),
})

export type ItemFormValues = z.infer<typeof schema>

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: {
    label: string
    slug?: string
    descricao?: string | null
    ordem?: number
    ativo?: boolean
    produtoId?: string
    metadata?: Record<string, unknown>
  }) => Promise<void> | void
  loading?: boolean
  category: CatalogCategory | null
  item?: CatalogItem | null
}

export function ItemDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  category,
  item,
}: ItemDialogProps) {
  const { data: produtos } = useListarProdutos()

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: '',
      slug: undefined,
      descricao: undefined,
      ordem: undefined,
      ativo: true,
      produtoId: undefined,
      metadata: undefined,
    },
  })

  React.useEffect(() => {
    if (item && open) {
      form.reset({
        label: item.label,
        slug: item.slug,
        descricao: item.descricao ?? undefined,
        ordem: item.ordem,
        ativo: item.ativo,
        produtoId: item.produtoId ?? undefined,
        metadata: item.metadata ? JSON.stringify(item.metadata, null, 2) : undefined,
      })
    } else if (!open) {
      form.reset({
        label: '',
        slug: undefined,
        descricao: undefined,
        ordem: undefined,
        ativo: true,
        produtoId: undefined,
        metadata: undefined,
      })
    }
  }, [item, open, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    let metadataObject: Record<string, unknown> | undefined
    if (values.metadata) {
      try {
        metadataObject = JSON.parse(values.metadata)
        if (typeof metadataObject !== 'object' || Array.isArray(metadataObject)) {
          throw new Error('Metadados devem ser um objeto JSON.')
        }
      } catch (error) {
        form.setError('metadata', {
          message:
            error instanceof Error
              ? error.message
              : 'Metadados inválidos. Informe um objeto JSON válido.',
        })
        return
      }
    }

    try {
      await onSubmit({
        label: values.label,
        slug: values.slug,
        descricao: values.descricao ?? null,
        ordem: values.ordem,
        ativo: values.ativo,
        produtoId: category?.escopoProduto ? values.produtoId : undefined,
        metadata: metadataObject,
      })
    } catch (error) {
      // Erro já é tratado pelo hook de mutation
      console.error('Erro ao submeter item:', error)
    }
  })

  const handleCancel = () => {
    if (loading) return // Não permitir cancelar durante loading
    form.reset()
    onOpenChange(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onEscapeKeyDown={() => handleOpenChange(false)}
        onPointerDownOutside={() => handleOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>{item ? 'Editar item' : 'Novo item'}</DialogTitle>
          <DialogDescription>
            Gerencie os valores apresentados nas telas do módulo selecionado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Novo, Triagem, Em Pesquisa..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="novo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ordem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Ex.: 1"
                        value={field.value ?? ''}
                        onChange={(event) => {
                          const value = event.target.value
                          field.onChange(value === '' ? undefined : Number(value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o uso deste item para orientar PMs durante a seleção..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {category?.escopoProduto && (
              <FormField
                control={form.control}
                name="produtoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto associado</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'all' ? undefined : value)}
                      value={field.value ?? 'all'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todos os produtos</SelectItem>
                        {produtos?.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-dashed border-border px-4 py-3">
                  <div className="space-y-1">
                    <FormLabel>Item ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Itens inativos ficam indisponíveis nas telas, mas preservam histórico.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadados JSON (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Ex.: {"color":"emerald","legacyValue":"NOVO"}'
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="gradient" disabled={loading} loading={loading}>
                {item ? 'Salvar alterações' : 'Adicionar item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
