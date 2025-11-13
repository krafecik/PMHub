'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Clock, User, Tag, AlertCircle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import * as Tabs from '@radix-ui/react-tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { buscarDemandaPorId } from '@/lib/demandas-api'
import { formatRelativeDate, cn } from '@/lib/utils'
import { Comentarios } from './comentarios'
import { AnexoUploader } from './anexo-uploader'

interface DemandaDrawerProps {
  demandaId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandaDrawer({ demandaId, open, onOpenChange }: DemandaDrawerProps) {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['demanda', demandaId],
    queryFn: () => buscarDemandaPorId(demandaId!),
    enabled: !!demandaId && open,
  })

  const handleEdit = () => {
    if (data) {
      router.push(`/demandas/${data.id}/editar`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-background/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onOpenChange(false)}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild>
              <motion.div
                className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l bg-background shadow-xl"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                      <p className="text-sm text-text-muted">Carregando detalhes...</p>
                    </div>
                  </div>
                ) : data ? (
                  <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="border-b px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2 text-sm text-text-muted">
                            <span>#{data.id}</span>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {data.tipoLabel}
                            </Badge>
                          </div>
                          <h2 className="truncate text-xl font-semibold text-text-primary">
                            {data.titulo}
                          </h2>
                        </div>
                        <Dialog.Close asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      <Tabs.Root defaultValue="resumo" className="flex h-full flex-col">
                        <Tabs.List className="flex border-b px-6">
                          <Tabs.Trigger
                            value="resumo"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Resumo
                          </Tabs.Trigger>
                          <Tabs.Trigger
                            value="contexto"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Contexto
                          </Tabs.Trigger>
                          <Tabs.Trigger
                            value="historico"
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                              'border-b-2 border-transparent text-text-secondary',
                              'hover:text-text-primary',
                              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-700',
                            )}
                          >
                            Histórico
                          </Tabs.Trigger>
                        </Tabs.List>

                        {/* Tab: Resumo */}
                        <Tabs.Content value="resumo" className="flex-1 space-y-6 p-6">
                          {/* Status e Info */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-text-secondary">
                                Status
                              </span>
                              <Badge variant={data.status === 'NOVO' ? 'success' : 'secondary'}>
                                {data.statusLabel}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-text-secondary">
                                Prioridade
                              </span>
                              <Badge
                                variant={
                                  data.prioridade === 'CRITICA'
                                    ? 'destructive'
                                    : data.prioridade === 'ALTA'
                                      ? 'warning'
                                      : data.prioridade === 'MEDIA'
                                        ? 'secondary'
                                        : 'outline'
                                }
                              >
                                {data.prioridadeLabel}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-text-secondary">
                                Origem
                              </span>
                              <span className="text-sm text-text-primary">{data.origemLabel}</span>
                            </div>
                            {data.origemDetalhe && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-secondary">
                                  Detalhe origem
                                </span>
                                <span className="text-sm text-text-primary">
                                  {data.origemDetalhe}
                                </span>
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Descrição */}
                          {data.descricao && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium text-text-secondary">Descrição</h3>
                              <p className="whitespace-pre-wrap text-sm text-text-primary">
                                {data.descricao}
                              </p>
                            </div>
                          )}

                          {/* Tags */}
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-text-secondary">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Tag className="mr-1 h-3 w-3" />
                                Tag exemplo
                              </Badge>
                            </div>
                          </div>

                          <Separator />

                          {/* Anexos */}
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-text-secondary">Anexos</h3>
                            <AnexoUploader demandaId={data.id} />
                          </div>

                          {/* Meta info */}
                          <div className="space-y-2 pt-4 text-xs text-text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Criado {formatRelativeDate(data.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Por usuário #{data.criadoPorId}</span>
                            </div>
                          </div>
                        </Tabs.Content>

                        {/* Tab: Contexto */}
                        <Tabs.Content value="contexto" className="flex-1 p-6">
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <AlertCircle className="mb-4 h-12 w-12 text-text-muted" />
                            <h3 className="mb-2 text-base font-medium text-text-primary">
                              Contexto em desenvolvimento
                            </h3>
                            <p className="max-w-sm text-sm text-text-secondary">
                              Aqui serão exibidas informações adicionais sobre o contexto da demanda
                            </p>
                          </div>
                        </Tabs.Content>

                        {/* Tab: Histórico */}
                        <Tabs.Content value="historico" className="flex-1 overflow-y-auto">
                          <div className="p-6">
                            <Comentarios demandaId={data.id} />
                          </div>
                        </Tabs.Content>
                      </Tabs.Root>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Button variant="outline" className="flex-1">
                          Mover para Triagem
                        </Button>
                        <Button variant="default" className="flex-1" onClick={handleEdit}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
