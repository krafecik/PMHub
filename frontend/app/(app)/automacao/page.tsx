'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Settings, Plus, Search, Power, Edit, Trash2, Copy, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsHeader } from '@/components/ui/stats-header'
import { HelpButton } from '@/components/ui/help-button'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { AnimatedEmptyState, AnimatedIllustration } from '@/components/ui/animated-empty-state'
import { FadeIn } from '@/components/motion'
import { ModalCriarRegra } from '@/components/automacao/modal-criar-regra'
import { ModalEditarRegra } from '@/components/automacao/modal-editar-regra'
import {
  listarRegras,
  alternarStatusRegra,
  deletarRegra,
  type RegraListItem,
} from '@/lib/automacao-api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const automacaoHelpContent = (
  <div className="space-y-4">
    <h3>Como usar Automação de Regras</h3>

    <h4>O que são Regras de Automação?</h4>
    <p>
      Regras permitem automatizar ações baseadas em condições. Exemplo: se origem = Suporte e tipo =
      Problema, então definir urgência como Média.
    </p>

    <h4>Componentes de uma Regra</h4>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>Condições:</strong> Critérios que devem ser atendidos
      </li>
      <li>
        <strong>Ações:</strong> O que será executado automaticamente
      </li>
      <li>
        <strong>Ordem:</strong> Prioridade de execução
      </li>
    </ul>

    <h4>Exemplos de Uso</h4>
    <ul className="list-disc space-y-1 pl-5">
      <li>Atribuir PM automaticamente por tipo de demanda</li>
      <li>Definir urgência baseada na origem</li>
      <li>Adicionar tags específicas por produto</li>
      <li>Tornar campos obrigatórios condicionalmente</li>
    </ul>

    <h4>Dicas</h4>
    <ul className="list-disc space-y-1 pl-5">
      <li>Teste as regras em algumas demandas antes de ativar</li>
      <li>Use a ordem para controlar a sequência de execução</li>
      <li>Desative temporariamente ao invés de deletar</li>
    </ul>
  </div>
)

export default function AutomacaoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [modalCriarOpen, setModalCriarOpen] = useState(false)
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [regraEditando, setRegraEditando] = useState<RegraListItem | null>(null)
  const [deletarDialog, setDeletarDialog] = useState<{
    open: boolean
    regra: RegraListItem | null
  }>({
    open: false,
    regra: null,
  })

  const {
    data: regras,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['automacao-regras'],
    queryFn: () => listarRegras(),
  })

  const handleToggleStatus = async (regra: RegraListItem) => {
    try {
      await alternarStatusRegra(regra.id, !regra.ativo)
      toast.success(regra.ativo ? 'Regra desativada' : 'Regra ativada')
      refetch()
    } catch (error) {
      toast.error('Erro ao alterar status da regra')
    }
  }

  const handleDeletar = async () => {
    if (!deletarDialog.regra) return

    try {
      await deletarRegra(deletarDialog.regra.id)
      toast.success('Regra deletada com sucesso')
      setDeletarDialog({ open: false, regra: null })
      refetch()
    } catch (error) {
      toast.error('Erro ao deletar regra')
    }
  }

  const handleEditar = (regra: RegraListItem) => {
    setRegraEditando(regra)
    setModalEditarOpen(true)
  }

  const handleDuplicar = () => {
    // TODO: Implementar duplicação
    toast.info('Funcionalidade em desenvolvimento')
  }

  const filteredRegras = regras?.filter(
    (regra) =>
      regra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regra.descricao?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = [
    {
      label: 'Total de Regras',
      value: regras?.length.toString() || '0',
      icon: <Settings className="h-5 w-5" />,
      color: 'primary' as const,
    },
    {
      label: 'Regras Ativas',
      value: regras?.filter((r) => r.ativo).length.toString() || '0',
      icon: <Power className="h-5 w-5" />,
      color: 'success' as const,
    },
    {
      label: 'Ações Configuradas',
      value: regras?.reduce((acc, r) => acc + r.qtdAcoes, 0).toString() || '0',
      icon: <Zap className="h-5 w-5" />,
      color: 'accent' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <FadeIn>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automação de Regras</h1>
            <p className="mt-2 text-muted-foreground">
              Configure regras para automatizar ações durante a triagem
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton title="Ajuda - Automação" content={automacaoHelpContent} />
            <Button variant="gradient" onClick={() => setModalCriarOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </div>
        </div>

        {/* Stats */}
        <StatsHeader stats={stats} />

        {/* Search */}
        <Card variant="elevated" className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Lista de Regras */}
        <div className="space-y-4">
          {isLoading ? (
            <SkeletonCard count={3} />
          ) : filteredRegras && filteredRegras.length > 0 ? (
            filteredRegras.map((regra) => (
              <Card
                key={regra.id}
                variant="elevated"
                className="p-6 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{regra.nome}</h3>
                      <Badge variant={regra.ativo ? 'success' : 'secondary'}>
                        {regra.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline">Ordem: {regra.ordem}</Badge>
                    </div>

                    {regra.descricao && (
                      <p className="mb-3 text-sm text-muted-foreground">{regra.descricao}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                          <span className="font-medium text-blue-700 dark:text-blue-400">
                            {regra.qtdCondicoes}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {regra.qtdCondicoes === 1 ? 'Condição' : 'Condições'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                          <span className="font-medium text-green-700 dark:text-green-400">
                            {regra.qtdAcoes}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {regra.qtdAcoes === 1 ? 'Ação' : 'Ações'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(regra)}
                      title={regra.ativo ? 'Desativar' : 'Ativar'}
                    >
                      <Power className={cn('h-4 w-4', regra.ativo && 'text-green-600')} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditar(regra)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicar()}
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletarDialog({ open: true, regra })}
                      title="Deletar"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card variant="elevated" className="p-12">
              <AnimatedEmptyState
                icon={<AnimatedIllustration type="empty" />}
                title={searchTerm ? 'Nenhuma regra encontrada' : 'Nenhuma regra criada'}
                description={
                  searchTerm
                    ? 'Tente ajustar os termos de busca'
                    : 'Crie sua primeira regra de automação'
                }
                action={
                  !searchTerm && (
                    <Button variant="gradient" onClick={() => setModalCriarOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Regra
                    </Button>
                  )
                }
              />
            </Card>
          )}
        </div>
      </FadeIn>

      {/* Modal Criar Regra */}
      <ModalCriarRegra
        open={modalCriarOpen}
        onOpenChange={setModalCriarOpen}
        onSuccess={() => {
          refetch()
          setModalCriarOpen(false)
        }}
      />

      {/* Modal Editar Regra */}
      {regraEditando && (
        <ModalEditarRegra
          open={modalEditarOpen}
          onOpenChange={setModalEditarOpen}
          regra={regraEditando}
          onSuccess={() => {
            refetch()
            setModalEditarOpen(false)
            setRegraEditando(null)
          }}
        />
      )}

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog
        open={deletarDialog.open}
        onOpenChange={(open) => setDeletarDialog({ open, regra: deletarDialog.regra })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a regra &quot;{deletarDialog.regra?.nome}&quot;? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
