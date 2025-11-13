'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  createProduto,
  deleteProduto,
  fetchProdutos,
  Produto,
  updateProduto,
} from '@/lib/products-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package2,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { formatRelativeDate } from '@/lib/utils'

const produtoSchema = z.object({
  nome: z.string().min(3, 'Informe um nome com pelo menos 3 caracteres.'),
  descricao: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

type ProdutoFormValues = z.infer<typeof produtoSchema>

export default function ProdutosPage() {
  const queryClient = useQueryClient()
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      status: 'ACTIVE',
    },
  })

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: fetchProdutos,
  })

  const createMutation = useMutation({
    mutationFn: createProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      reset({ nome: '', descricao: '', status: 'ACTIVE' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProdutoFormValues }) =>
      updateProduto(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      setEditingProduto(null)
      reset({ nome: '', descricao: '', status: 'ACTIVE' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (editingProduto) {
      await updateMutation.mutateAsync({ id: editingProduto.id, payload: values })
      return
    }

    await createMutation.mutateAsync(values)
  })

  function onEdit(produto: Produto) {
    setEditingProduto(produto)
    reset({
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      status: (produto.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
    })
  }

  async function onDelete(id: string) {
    const confirmed = window.confirm('Confirma remover o produto?')
    if (!confirmed) return
    await deleteMutation.mutateAsync(id)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Produtos</h1>
          <p className="mt-2 text-text-secondary">
            Gerencie os produtos vinculados ao tenant atual
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button
            variant="gradient"
            onClick={() => {
              setEditingProduto(null)
              reset({ nome: '', descricao: '', status: 'ACTIVE' })
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Formulário */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-primary-600" />
            {editingProduto ? 'Editar produto' : 'Cadastrar novo produto'}
          </CardTitle>
          <CardDescription>
            Preencha as informações abaixo para {editingProduto ? 'atualizar' : 'criar'} um produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto</Label>
              <Input
                id="nome"
                placeholder="Ex: ERP Core, CRM, Fiscal"
                error={!!errors.nome}
                {...register('nome')}
              />
              {errors.nome && <p className="text-error-DEFAULT text-xs">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
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

            <div className="flex items-center gap-3 md:col-span-2">
              <Button
                type="submit"
                loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {editingProduto ? 'Salvar alterações' : 'Cadastrar produto'}
              </Button>
              {editingProduto && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProduto(null)
                    reset({ nome: '', descricao: '', status: 'ACTIVE' })
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de produtos */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Produtos cadastrados</CardTitle>
            <CardDescription>
              {produtos && produtos.length > 0
                ? `${produtos.length} produto${produtos.length > 1 ? 's' : ''} encontrado${produtos.length > 1 ? 's' : ''}`
                : 'Nenhum produto cadastrado ainda'}
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input placeholder="Buscar produtos..." className="w-[250px] pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="space-y-2 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                <p className="text-sm text-text-muted">Carregando produtos...</p>
              </div>
            </div>
          ) : produtos && produtos.length > 0 ? (
            <div className="divide-y divide-border">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <Package2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-text-primary">{produto.nome}</h4>
                        <Badge variant={produto.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {produto.status === 'ACTIVE' ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </div>
                      {produto.descricao && (
                        <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
                          {produto.descricao}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-text-muted">
                        Atualizado {formatRelativeDate(produto.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(produto)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 min-w-[160px] rounded-lg border bg-white p-1.5 shadow-lg"
                          sideOffset={5}
                        >
                          <DropdownMenu.Item
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary-100 hover:text-text-primary focus:bg-secondary-100 focus:text-text-primary"
                            onSelect={() => onEdit(produto)}
                          >
                            <Edit className="h-4 w-4" />
                            Editar produto
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="my-1 h-px bg-border" />
                          <DropdownMenu.Item
                            className="text-error-DEFAULT flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-error-light/20 focus:bg-error-light/20"
                            onSelect={() => onDelete(produto.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover produto
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div className="rounded-full bg-secondary-100 p-3">
                <Package2 className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="mt-4 text-base font-medium text-text-primary">
                Nenhum produto cadastrado
              </h3>
              <p className="mt-2 max-w-sm text-center text-sm text-text-secondary">
                Comece criando seu primeiro produto para organizar suas demandas e métricas
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setEditingProduto(null)
                  reset({ nome: '', descricao: '', status: 'ACTIVE' })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro produto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
