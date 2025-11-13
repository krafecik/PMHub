'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, Package2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { ModalCriarRapida } from '@/components/demandas/modal-criar-rapida'
import { DemandaDrawer } from '@/components/demandas/demanda-drawer'
import { listarDemandas } from '@/lib/demandas-api'
import { formatRelativeDate } from '@/lib/utils'
import { FadeIn } from '@/components/motion'

export default function DemandasPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDemandaId, setSelectedDemandaId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['demandas'],
    queryFn: () => listarDemandas(),
  })

  const handleCriarDemanda = () => {
    setModalOpen(true)
  }

  const handleSuccess = (demandaId: string) => {
    queryClient.invalidateQueries({ queryKey: ['demandas'] })
    setSelectedDemandaId(demandaId)
    setDrawerOpen(true)
  }

  const handleOpenDemanda = (demandaId: string) => {
    setSelectedDemandaId(demandaId)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Demandas</h1>
            <p className="mt-2 text-text-secondary">
              Todas as ideias, problemas e oportunidades em um só lugar
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Busca */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input placeholder="Buscar por título, descrição ou tags..." className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {/* Lista de demandas */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Demandas recentes</CardTitle>
            <CardDescription>
              {data
                ? `${data.total} demanda${data.total !== 1 ? 's' : ''} encontrada${data.total !== 1 ? 's' : ''}`
                : 'Carregando...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="space-y-2 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                  <p className="text-sm text-text-muted">Carregando demandas...</p>
                </div>
              </div>
            ) : data && data.data.length > 0 ? (
              <div className="divide-y divide-border">
                {data.data.map((demanda) => (
                  <div
                    key={demanda.id}
                    className="flex cursor-pointer items-start gap-4 px-6 py-4 transition-colors hover:bg-secondary-50"
                    onClick={() => handleOpenDemanda(demanda.id)}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <Package2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-medium text-text-primary">
                            {demanda.titulo}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {demanda.tipoLabel}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {demanda.origemLabel}
                            </Badge>
                            <span className="text-xs text-text-muted">
                              • {formatRelativeDate(demanda.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Badge
                            variant={
                              demanda.prioridade === 'CRITICA'
                                ? 'destructive'
                                : demanda.prioridade === 'ALTA'
                                  ? 'warning'
                                  : demanda.prioridade === 'MEDIA'
                                    ? 'secondary'
                                    : 'outline'
                            }
                          >
                            {demanda.prioridadeLabel}
                          </Badge>
                          <Badge variant={demanda.status === 'NOVO' ? 'success' : 'secondary'}>
                            {demanda.statusLabel}
                          </Badge>
                        </div>
                      </div>
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
                  Nenhuma demanda cadastrada
                </h3>
                <p className="mt-2 max-w-sm text-center text-sm text-text-secondary">
                  Comece criando sua primeira demanda para organizar ideias e problemas
                </p>
                <Button variant="outline" className="mt-6" onClick={handleCriarDemanda}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira demanda
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Botão flutuante */}
      <FloatingActionButton onClick={handleCriarDemanda}>
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Modal de criação */}
      <ModalCriarRapida open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleSuccess} />

      {/* Drawer de detalhes */}
      <DemandaDrawer demandaId={selectedDemandaId} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
