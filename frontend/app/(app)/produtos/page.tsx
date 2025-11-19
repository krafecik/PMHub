'use client'

import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteProduto, fetchProdutos, Produto } from '@/lib/products-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { ModalCriarProduto } from '@/components/produtos/modal-criar-produto'
import { ProdutoCard } from '@/components/produtos/produto-card'
import { StatsHeader } from '@/components/ui/stats-header'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { HelpButton, produtosHelpContent } from '@/components/ui/help-button'
import { Package2, Plus, Search, CheckCircle, XCircle, Activity } from 'lucide-react'
import { FadeIn, StaggerChildren } from '@/components/motion'
import { useToast } from '@/hooks/use-toast'

export default function ProdutosPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: fetchProdutos,
  })

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!produtos) return []

    const total = produtos.length
    const ativos = produtos.filter((p) => p.status === 'ACTIVE').length
    const inativos = produtos.filter((p) => p.status === 'INACTIVE').length
    const healthScore =
      produtos.length > 0
        ? Math.round(produtos.reduce((acc) => acc + 85, 0) / produtos.length) // Mock health score
        : 0

    return [
      {
        label: 'Total de Produtos',
        value: total,
        icon: <Package2 className="h-5 w-5" />,
        color: 'primary' as const,
      },
      {
        label: 'Produtos Ativos',
        value: ativos,
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'success' as const,
        change: 5,
        trend: 'up' as const,
      },
      {
        label: 'Produtos Inativos',
        value: inativos,
        icon: <XCircle className="h-5 w-5" />,
        color: 'error' as const,
      },
      {
        label: 'Saúde Média',
        value: `${healthScore}%`,
        icon: <Activity className="h-5 w-5" />,
        color: 'accent' as const,
        change: 3,
        trend: 'up' as const,
      },
    ]
  }, [produtos])

  // Filtrar produtos localmente pela busca
  const filteredProdutos = useMemo(() => {
    if (!produtos || !searchTerm) return produtos || []

    return produtos.filter(
      (produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [produtos, searchTerm])

  const deleteMutation = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({
        title: 'Produto removido',
        description: 'O produto foi removido com sucesso.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover produto',
        description: error.message || 'Ocorreu um erro ao remover o produto.',
        variant: 'destructive',
      })
    },
  })

  const handleNovoProduto = () => {
    setEditingProduto(null)
    setModalOpen(true)
  }

  const handleEditProduto = (produto: Produto) => {
    setEditingProduto(produto)
    setModalOpen(true)
  }

  const handleDeleteProduto = async (id: string) => {
    const confirmed = window.confirm('Confirma remover o produto?')
    if (!confirmed) return
    await deleteMutation.mutateAsync(id)
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['produtos'] })
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Produtos</h1>
            <p className="mt-2 text-text-secondary">
              Gerencie os produtos vinculados ao tenant atual
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton title="Ajuda - Gerenciamento de Produtos" content={produtosHelpContent} />
            <Button
              variant="gradient"
              onClick={handleNovoProduto}
              className="hidden sm:inline-flex"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && <StatsHeader stats={stats} className="mt-8" />}

        {/* Search */}
        <Card variant="elevated" className="mt-8">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Buscar produtos por nome ou descrição..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Grid de Produtos */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SkeletonCard variant="produto" count={8} />
            </div>
          ) : filteredProdutos && filteredProdutos.length > 0 ? (
            <StaggerChildren className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProdutos.map((produto, index) => (
                <ProdutoCard
                  key={produto.id}
                  produto={{
                    ...produto,
                    demandasCount: Math.floor(Math.random() * 50), // Mock data
                    demandasAtivas: Math.floor(Math.random() * 20), // Mock data
                    healthScore: 75 + Math.floor(Math.random() * 25), // Mock data
                  }}
                  onEdit={() => handleEditProduto(produto)}
                  onDelete={() => handleDeleteProduto(produto.id)}
                  index={index}
                />
              ))}
            </StaggerChildren>
          ) : (
            <Card variant="elevated" className="p-12">
              {searchTerm ? (
                <AnimatedEmptyState
                  icon={<AnimatedIllustration type="search" />}
                  title="Nenhum produto encontrado"
                  description="Tente ajustar os termos de busca"
                />
              ) : (
                <AnimatedEmptyState
                  icon={<AnimatedIllustration type="empty" />}
                  title="Nenhum produto cadastrado"
                  description="Comece criando seu primeiro produto para organizar suas demandas e métricas"
                  action={
                    <Button variant="gradient" onClick={handleNovoProduto}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar primeiro produto
                    </Button>
                  }
                />
              )}
            </Card>
          )}
        </div>
      </FadeIn>

      {/* Botão flutuante */}
      <FloatingActionButton onClick={handleNovoProduto}>
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Modal de criação/edição */}
      <ModalCriarProduto
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
        editingProduto={editingProduto}
      />
    </div>
  )
}
