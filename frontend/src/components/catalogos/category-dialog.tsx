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
import { CatalogCategory } from '@/lib/catalogos-api'

const schema = z.object({
  nome: z
    .string({ required_error: 'Informe um nome para a categoria.' })
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(100, 'Nome deve ter no máximo 100 caracteres.'),
  slug: z
    .string()
    .max(100, 'Slug deve ter no máximo 100 caracteres.')
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : undefined)),
  descricao: z
    .string()
    .max(250, 'Descrição deve ter no máximo 250 caracteres.')
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : undefined)),
  escopoProduto: z.boolean().default(false),
})

export type CategoryFormValues = z.infer<typeof schema>

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CategoryFormValues) => Promise<void> | void
  loading?: boolean
  category?: CatalogCategory | null
}

export function CategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  category,
}: CategoryDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      slug: undefined,
      descricao: undefined,
      escopoProduto: false,
    },
  })

  React.useEffect(() => {
    if (category && open) {
      form.reset({
        nome: category.nome,
        slug: category.slug,
        descricao: category.descricao ?? undefined,
        escopoProduto: category.escopoProduto,
      })
    } else if (!open) {
      form.reset({
        nome: '',
        slug: undefined,
        descricao: undefined,
        escopoProduto: false,
      })
    }
  }, [category, open, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      // Erro já é tratado pelo hook de mutation
      console.error('Erro ao submeter categoria:', error)
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
        className="sm:max-w-lg"
        onEscapeKeyDown={() => handleOpenChange(false)}
        onPointerDownOutside={() => handleOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          <DialogDescription>
            Defina catálogos para personalizar opções exibidas nas telas do produto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Status da Demanda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="status_demanda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explique o uso desta categoria para facilitar a governança..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="escopoProduto"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-dashed border-border px-4 py-3">
                  <div className="space-y-1">
                    <FormLabel>Escopo por produto</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Permite configurar valores específicos para cada produto do tenant.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="gradient" disabled={loading} loading={loading}>
                {category ? 'Salvar alterações' : 'Criar categoria'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
