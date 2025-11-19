'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Bug,
  Rocket,
  Package2,
  Calendar,
  User,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  buscarDuplicatasSugeridas,
  gerarSugestoesDuplicacaoIa,
  marcarComoDuplicata,
  type DuplicataIaSugestao,
} from '@/lib/triagem-api'

interface ModalDuplicatasProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandaId: string
  demandaTitulo: string
}

const tipoIcons = {
  IDEIA: Lightbulb,
  PROBLEMA: Bug,
  OPORTUNIDADE: Rocket,
  OUTRO: Package2,
} as const

export function ModalDuplicatas({
  open,
  onOpenChange,
  demandaId,
  demandaTitulo,
}: ModalDuplicatasProps) {
  const [selectedDuplicata, setSelectedDuplicata] = React.useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [iaSugestoes, setIaSugestoes] = React.useState<DuplicataIaSugestao[]>([])

  // Buscar duplicatas sugeridas
  const { data: duplicatas, isLoading } = useQuery({
    queryKey: ['duplicatas', demandaId],
    queryFn: () => buscarDuplicatasSugeridas(demandaId),
    enabled: open,
  })

  React.useEffect(() => {
    if (!open) {
      setIaSugestoes([])
    }
  }, [open])

  // Mutation para marcar como duplicata
  const { mutate: marcarDuplicata, isPending } = useMutation({
    mutationFn: (demandaOriginalId: string) =>
      marcarComoDuplicata(demandaId, {
        demandaOriginalId,
        similaridade:
          duplicatas?.find((d) => d.id === demandaOriginalId)?.similaridade ??
          iaSugestoes.find((d) => d.id === demandaOriginalId)?.similaridadeIa,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triagem'] })
      toast({
        title: 'Demanda marcada como duplicata',
        description: 'A demanda foi vinculada à demanda original com sucesso.',
      })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao marcar duplicata',
        description: error.message || 'Ocorreu um erro ao processar a solicitação.',
        variant: 'destructive',
      })
    },
  })

  const { mutateAsync: gerarSugestoesIa, isPending: iaLoading } = useMutation({
    mutationFn: () => gerarSugestoesDuplicacaoIa(demandaId),
    onSuccess: (sugestoes) => {
      setIaSugestoes(sugestoes)
      if (sugestoes.length === 0) {
        toast({
          title: 'Nenhuma sugestão encontrada',
          description: 'A IA não identificou duplicatas prováveis para esta demanda.',
        })
      } else {
        toast({
          title: 'Sugestões geradas',
          description: 'A IA analisou a demanda e sugeriu possíveis duplicatas.',
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar sugestões',
        description: error.message || 'Não foi possível gerar sugestões com IA.',
        variant: 'destructive',
      })
    },
  })

  const handleConfirmar = () => {
    if (selectedDuplicata) {
      marcarDuplicata(selectedDuplicata)
    }
  }

  const getSimilaridadeBadge = (similaridade: number) => {
    if (similaridade >= 80) return 'success'
    if (similaridade >= 60) return 'warning'
    return 'secondary'
  }

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
                  className="h-[85vh] max-h-[800px] w-full max-w-4xl"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                >
                  <div className="flex h-full flex-col rounded-lg border border-border bg-background shadow-xl">
                    {/* Header */}
                    <div className="border-b p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-light/20">
                            <Copy className="text-warning-DEFAULT h-5 w-5" />
                          </div>
                          <div>
                            <Dialog.Title className="text-xl font-semibold text-text-primary">
                              Possíveis Duplicatas Detectadas
                            </Dialog.Title>
                            <p className="mt-1 text-sm text-text-secondary">
                              Selecione a demanda original para vincular como duplicata
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => gerarSugestoesIa()}
                          disabled={iaLoading}
                        >
                          {iaLoading ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-500" />
                          ) : (
                            <Lightbulb className="mr-2 h-4 w-4" />
                          )}
                          {iaSugestoes.length > 0 ? 'Regerar com IA' : 'Gerar sugestões IA'}
                        </Button>
                        <Dialog.Close asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1 p-6">
                      {/* Demanda atual */}
                      <div className="mb-6">
                        <h3 className="mb-3 text-sm font-medium text-text-muted">Demanda Atual</h3>
                        <Card variant="outline" className="bg-secondary-50 p-4">
                          <div className="flex items-center gap-2">
                            <Copy className="h-4 w-4 text-text-muted" />
                            <span className="text-sm font-medium">
                              #{demandaId} - {demandaTitulo}
                            </span>
                          </div>
                        </Card>
                      </div>

                      {/* Lista de duplicatas */}
                      <div>
                        <h3 className="mb-3 text-sm font-medium text-text-muted">
                          Demandas Similares Encontradas
                        </h3>

                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
                          </div>
                        ) : duplicatas && duplicatas.length > 0 ? (
                          <div className="space-y-3">
                            {duplicatas.map((duplicata) => {
                              const Icon =
                                tipoIcons[duplicata.tipo as keyof typeof tipoIcons] || Package2
                              const isSelected = selectedDuplicata === duplicata.id

                              return (
                                <motion.div
                                  key={duplicata.id}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                >
                                  <Card
                                    variant={isSelected ? 'elevated' : 'outline'}
                                    className={cn(
                                      'cursor-pointer p-4 transition-all',
                                      isSelected && 'bg-primary-50 ring-2 ring-primary-200',
                                    )}
                                    onClick={() => setSelectedDuplicata(duplicata.id)}
                                  >
                                    <div className="flex items-start gap-4">
                                      {/* Checkbox/Radio */}
                                      <div className="mt-1">
                                        {isSelected ? (
                                          <CheckCircle className="h-5 w-5 text-primary-500" />
                                        ) : (
                                          <div className="h-5 w-5 rounded-full border-2 border-secondary-300" />
                                        )}
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-text-muted" />
                                            <span className="font-medium text-text-primary">
                                              #{duplicata.id}
                                            </span>
                                            <Badge
                                              variant={
                                                getSimilaridadeBadge(duplicata.similaridade) as any
                                              }
                                            >
                                              <Percent className="mr-1 h-3 w-3" />
                                              {duplicata.similaridade}% similar
                                            </Badge>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {duplicata.produtoNome}
                                          </Badge>
                                        </div>

                                        <h4 className="font-medium text-text-primary">
                                          {duplicata.titulo}
                                        </h4>

                                        {duplicata.descricao && (
                                          <p className="line-clamp-2 text-sm text-text-secondary">
                                            {duplicata.descricao}
                                          </p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-text-muted">
                                          <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {duplicata.origem}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(duplicata.createdAt).toLocaleDateString()}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {duplicata.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </motion.div>
                              )
                            })}
                          </div>
                        ) : (
                          <Card variant="outline" className="p-8">
                            <div className="flex flex-col items-center justify-center text-center">
                              <AlertCircle className="mb-3 h-8 w-8 text-text-muted" />
                              <p className="text-sm text-text-secondary">
                                Nenhuma duplicata sugerida encontrada
                              </p>
                            </div>
                          </Card>
                        )}
                      </div>

                      {/* Sugestões IA */}
                      {iaSugestoes.length > 0 && (
                        <div className="mt-8">
                          <h3 className="mb-3 text-sm font-medium text-primary-700 dark:text-primary-200">
                            Sugestões da IA
                          </h3>
                          <div className="space-y-3">
                            {iaSugestoes.map((sugestao) => {
                              const Icon =
                                tipoIcons[sugestao.tipo as keyof typeof tipoIcons] || Package2
                              const isSelected = selectedDuplicata === sugestao.id
                              return (
                                <motion.div
                                  key={`ia-${sugestao.id}`}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                >
                                  <Card
                                    variant={isSelected ? 'elevated' : 'outline'}
                                    className={cn(
                                      'cursor-pointer border-primary-200/60 p-4 transition-all dark:border-primary-900/40',
                                      isSelected &&
                                        'bg-primary-50 ring-2 ring-primary-300 dark:bg-primary-900/20',
                                    )}
                                    onClick={() => setSelectedDuplicata(sugestao.id)}
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="mt-1">
                                        {isSelected ? (
                                          <CheckCircle className="h-5 w-5 text-primary-500" />
                                        ) : (
                                          <div className="h-5 w-5 rounded-full border-2 border-primary-200" />
                                        )}
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-primary-500" />
                                            <span className="font-medium text-text-primary">
                                              #{sugestao.id}
                                            </span>
                                            <Badge variant="success">
                                              IA {sugestao.similaridadeIa.toFixed(0)}%
                                            </Badge>
                                            <Badge variant="outline">
                                              Modelo {sugestao.similaridadeCalculada.toFixed(0)}%
                                            </Badge>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {sugestao.status}
                                          </Badge>
                                        </div>
                                        <h4 className="font-medium text-text-primary">
                                          {sugestao.titulo}
                                        </h4>
                                        {sugestao.descricao && (
                                          <p className="line-clamp-2 text-sm text-text-secondary">
                                            {sugestao.descricao}
                                          </p>
                                        )}
                                        <div className="rounded-lg border border-primary-200/60 bg-primary-50/60 p-3 text-xs text-primary-900 dark:border-primary-900/40 dark:bg-primary-900/20 dark:text-primary-100">
                                          <p className="text-[10px] font-medium uppercase tracking-wide text-primary-600 dark:text-primary-300">
                                            Justificativa IA
                                          </p>
                                          <p className="mt-1 leading-relaxed">
                                            {sugestao.justificativa}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </ScrollArea>

                    {/* Footer */}
                    <div className="border-t bg-background p-6">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-muted">
                          {duplicatas?.length || 0} demandas similares encontradas
                        </p>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="gradient"
                            onClick={handleConfirmar}
                            disabled={!selectedDuplicata || isPending}
                            loading={isPending}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Marcar como Duplicata
                          </Button>
                        </div>
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
