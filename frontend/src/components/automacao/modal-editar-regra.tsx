'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Zap, AlertCircle, Loader2 } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  atualizarRegra,
  obterRegra,
  type AtualizarRegraPayload,
  type RegraListItem,
  type CondicaoRegraInput,
  type AcaoRegraInput,
} from '@/lib/automacao-api'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'

interface ModalEditarRegraProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  regra: RegraListItem
  onSuccess: () => void
}

type CondicaoFormValue = CondicaoRegraInput

type AcaoFormValue = AcaoRegraInput

type CatalogOption = {
  id: string
  slug: string
  label: string
  metadata: Record<string, unknown> | null
}

export function ModalEditarRegra({ open, onOpenChange, regra, onSuccess }: ModalEditarRegraProps) {
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [ordem, setOrdem] = React.useState('0')
  const [condicoes, setCondicoes] = React.useState<CondicaoFormValue[]>([])
  const [acoes, setAcoes] = React.useState<AcaoFormValue[]>([])
  const [erros, setErros] = React.useState<Record<string, string>>({})

  // Buscar detalhes da regra
  const { data: regraDetalhada, isLoading: loadingRegra } = useQuery({
    queryKey: ['regra-detalhes', regra.id],
    queryFn: () => obterRegra(regra.id),
    enabled: open,
  })

  // Preencher formulário quando carregar os dados
  React.useEffect(() => {
    if (regraDetalhada) {
      setNome(regraDetalhada.nome)
      setDescricao(regraDetalhada.descricao || '')
      setOrdem(regraDetalhada.ordem.toString())
      setCondicoes(
        regraDetalhada.condicoes.map((cond) => ({
          campoId: cond.campoId,
          operadorId: cond.operadorId,
          valor:
            cond.valor === undefined || cond.valor === null
              ? ''
              : typeof cond.valor === 'string'
                ? cond.valor
                : String(cond.valor),
          logica: cond.logica ?? 'E',
        })),
      )
      setAcoes(
        regraDetalhada.acoes.map((acao) => ({
          tipoId: acao.tipoId,
          campoId: acao.campoId,
          valor:
            acao.valor === undefined || acao.valor === null
              ? ''
              : typeof acao.valor === 'string'
                ? acao.valor
                : String(acao.valor),
          configuracao: acao.configuracao,
        })),
      )
    }
  }, [regraDetalhada])

  const camposCatalog = useCatalogItemsBySlug('automacao_campos', {
    includeInativos: false,
    enabled: open,
  })
  const operadoresCatalog = useCatalogItemsBySlug('automacao_operadores', {
    includeInativos: false,
    enabled: open,
  })
  const tiposAcaoCatalog = useCatalogItemsBySlug('automacao_acoes', {
    includeInativos: false,
    enabled: open,
  })

  const campos = React.useMemo<CatalogOption[]>(() => {
    const itens = camposCatalog.data?.itens ?? []
    return itens
      .filter((item) => item.ativo !== false)
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        label: item.label,
        metadata: item.metadata ?? null,
      }))
  }, [camposCatalog.data])

  const operadores = React.useMemo<CatalogOption[]>(() => {
    const itens = operadoresCatalog.data?.itens ?? []
    return itens
      .filter((item) => item.ativo !== false)
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        label: item.label,
        metadata: item.metadata ?? null,
      }))
  }, [operadoresCatalog.data])

  const tiposAcao = React.useMemo<CatalogOption[]>(() => {
    const itens = tiposAcaoCatalog.data?.itens ?? []
    return itens
      .filter((item) => item.ativo !== false)
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        label: item.label,
        metadata: item.metadata ?? null,
      }))
  }, [tiposAcaoCatalog.data])

  const operadoresMap = React.useMemo(
    () => new Map(operadores.map((op) => [op.id, op])),
    [operadores],
  )
  const tiposAcaoMap = React.useMemo(
    () => new Map(tiposAcao.map((acao) => [acao.id, acao])),
    [tiposAcao],
  )

  // Mutation para atualizar regra
  const atualizarMutation = useMutation({
    mutationFn: (payload: AtualizarRegraPayload) => atualizarRegra(regra.id, payload),
    onSuccess: () => {
      toast.success('Regra atualizada com sucesso!')
      onSuccess()
    },
    onError: () => {
      toast.error('Erro ao atualizar regra')
    },
  })

  const adicionarCondicao = () => {
    if (campos.length === 0 || operadores.length === 0) {
      toast.error('Configure campos e operadores nos catálogos antes de adicionar condições.')
      return
    }
    setCondicoes((prev) => [
      ...prev,
      {
        campoId: campos[0].id,
        operadorId: operadores[0].id,
        valor: '',
        logica: 'E',
      },
    ])
  }

  const removerCondicao = (index: number) => {
    setCondicoes((prev) => prev.filter((_, i) => i !== index))
  }

  const atualizarCondicao = (index: number, condicao: CondicaoFormValue) => {
    setCondicoes((prev) => {
      const novas = [...prev]
      novas[index] = condicao
      return novas
    })
  }

  const adicionarAcao = () => {
    if (tiposAcao.length === 0) {
      toast.error('Configure tipos de ação no catálogo antes de adicionar ações.')
      return
    }
    const tipoDefault = tiposAcao[0]
    const meta = tipoDefault.metadata as Record<string, unknown> | null
    const requiresCampo = Boolean(meta?.requiresField)
    const requiresValor = Boolean(meta?.requiresValue)

    setAcoes((prev) => [
      ...prev,
      {
        tipoId: tipoDefault.id,
        campoId: requiresCampo ? campos[0]?.id : undefined,
        valor: requiresValor ? '' : undefined,
        configuracao: undefined,
      },
    ])
  }

  const removerAcao = (index: number) => {
    setAcoes((prev) => prev.filter((_, i) => i !== index))
  }

  const atualizarAcao = (index: number, acao: AcaoFormValue) => {
    setAcoes((prev) => {
      const novas = [...prev]
      novas[index] = acao
      return novas
    })
  }

  const validar = (): boolean => {
    const novosErros: Record<string, string> = {}

    if (!nome.trim()) {
      novosErros.nome = 'Nome é obrigatório'
    }

    if (condicoes.length === 0) {
      novosErros.condicoes = 'Adicione pelo menos uma condição'
    }

    if (acoes.length === 0) {
      novosErros.acoes = 'Adicione pelo menos uma ação'
    }

    // Validar condições
    condicoes.forEach((cond, i) => {
      if (!cond.campoId) {
        novosErros[`condicao_${i}_campo`] = 'Campo é obrigatório'
      }

      const operadorMeta = operadoresMap.get(cond.operadorId)?.metadata as Record<
        string,
        unknown
      > | null
      const requiresValue =
        typeof operadorMeta?.requiresValue === 'boolean'
          ? (operadorMeta.requiresValue as boolean)
          : true

      if (
        requiresValue &&
        (cond.valor === undefined || cond.valor === null || String(cond.valor).trim().length === 0)
      ) {
        novosErros[`condicao_${i}_valor`] = 'Valor é obrigatório'
      }
    })

    // Validar ações
    acoes.forEach((acao, i) => {
      const tipoMeta = tiposAcaoMap.get(acao.tipoId)?.metadata as Record<string, unknown> | null
      const requiresField =
        typeof tipoMeta?.requiresField === 'boolean' ? (tipoMeta.requiresField as boolean) : false
      const requiresValor =
        typeof tipoMeta?.requiresValue === 'boolean' ? (tipoMeta.requiresValue as boolean) : false

      if (requiresField && !acao.campoId) {
        novosErros[`acao_${i}_campo`] = 'Campo é obrigatório'
      }

      if (
        requiresValor &&
        (acao.valor === undefined || acao.valor === null || String(acao.valor).trim().length === 0)
      ) {
        novosErros[`acao_${i}_valor`] = 'Valor é obrigatório'
      }
    })

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = () => {
    if (!validar()) return

    const payload: AtualizarRegraPayload = {
      nome,
      descricao: descricao || undefined,
      condicoes: condicoes.map((cond) => ({
        campoId: cond.campoId,
        operadorId: cond.operadorId,
        valor: cond.valor && cond.valor.toString().trim().length > 0 ? cond.valor : undefined,
        logica: cond.logica ?? 'E',
      })),
      acoes: acoes.map((acao) => ({
        tipoId: acao.tipoId,
        campoId: acao.campoId && acao.campoId.length > 0 ? acao.campoId : undefined,
        valor: acao.valor && acao.valor.toString().trim().length > 0 ? acao.valor : undefined,
        configuracao: acao.configuracao,
      })),
      ordem: parseInt(ordem) || 0,
    }

    atualizarMutation.mutate(payload)
  }

  if (loadingRegra) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Regra de Automação</DialogTitle>
          <DialogDescription>Modifique as condições e ações da regra</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome da Regra <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Auto-atribuir urgência para suporte"
                className={erros.nome ? 'border-destructive' : ''}
              />
              {erros.nome && <p className="text-destructive text-sm">{erros.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que esta regra faz..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de Execução</Label>
              <Input
                id="ordem"
                type="number"
                min="0"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Para ativar ou desativar a regra, use o botão de poder na lista de regras
              </p>
            </div>
          </div>

          <Separator />

          {/* Condições */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Condições</h3>
                <p className="text-sm text-muted-foreground">
                  Quando estas condições forem atendidas...
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={adicionarCondicao}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Condição
              </Button>
            </div>

            {erros.condicoes && (
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{erros.condicoes}</span>
              </div>
            )}

            <AnimatePresence>
              {condicoes.map((condicao, index) => {
                const operadorMeta = operadoresMap.get(condicao.operadorId)?.metadata as Record<
                  string,
                  unknown
                > | null
                const requiresValor =
                  typeof operadorMeta?.requiresValue === 'boolean'
                    ? (operadorMeta.requiresValue as boolean)
                    : true

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start gap-4">
                        {index > 0 && (
                          <Badge variant="outline" className="mt-2">
                            {condicao.logica || 'E'}
                          </Badge>
                        )}

                        <div className="grid flex-1 grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Campo</Label>
                            <Select
                              value={condicao.campoId}
                              onValueChange={(valor) =>
                                atualizarCondicao(index, {
                                  ...condicao,
                                  campoId: valor,
                                })
                              }
                            >
                              <SelectTrigger
                                className={
                                  erros[`condicao_${index}_campo`] ? 'border-destructive' : ''
                                }
                              >
                                <SelectValue placeholder="Selecione o campo" />
                              </SelectTrigger>
                              <SelectContent>
                                {campos.map((campo) => (
                                  <SelectItem key={campo.id} value={campo.id}>
                                    {campo.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Operador</Label>
                            <Select
                              value={condicao.operadorId}
                              onValueChange={(valor) => {
                                const meta = operadoresMap.get(valor)?.metadata as Record<
                                  string,
                                  unknown
                                > | null
                                const precisaValor =
                                  typeof meta?.requiresValue === 'boolean'
                                    ? (meta.requiresValue as boolean)
                                    : true
                                atualizarCondicao(index, {
                                  ...condicao,
                                  operadorId: valor,
                                  valor: precisaValor ? (condicao.valor ?? '') : undefined,
                                })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o operador" />
                              </SelectTrigger>
                              <SelectContent>
                                {operadores.map((operador) => (
                                  <SelectItem key={operador.id} value={operador.id}>
                                    {operador.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {requiresValor && (
                            <div className="space-y-2">
                              <Label>Valor</Label>
                              <Input
                                value={condicao.valor ?? ''}
                                onChange={(e) =>
                                  atualizarCondicao(index, {
                                    ...condicao,
                                    valor: e.target.value,
                                  })
                                }
                                placeholder="Digite o valor"
                                className={
                                  erros[`condicao_${index}_valor`] ? 'border-destructive' : ''
                                }
                              />
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerCondicao(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Ações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ações</h3>
                <p className="text-sm text-muted-foreground">
                  ...execute estas ações automaticamente
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={adicionarAcao}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Ação
              </Button>
            </div>

            {erros.acoes && (
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{erros.acoes}</span>
              </div>
            )}

            <AnimatePresence>
              {acoes.map((acao, index) => {
                const tipoMeta = tiposAcaoMap.get(acao.tipoId)?.metadata as Record<
                  string,
                  unknown
                > | null
                const requiresCampo = Boolean(tipoMeta?.requiresField)
                const requiresValor = Boolean(tipoMeta?.requiresValue)
                const requiresConfiguracao = Boolean(tipoMeta?.requiresConfig)

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-2">
                          <Zap className="text-primary h-4 w-4" />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Tipo de Ação</Label>
                              <Select
                                value={acao.tipoId}
                                onValueChange={(valor) => {
                                  const meta = tiposAcaoMap.get(valor)?.metadata as Record<
                                    string,
                                    unknown
                                  > | null
                                  const precisaCampo = Boolean(meta?.requiresField)
                                  const precisaValor = Boolean(meta?.requiresValue)
                                  atualizarAcao(index, {
                                    tipoId: valor,
                                    campoId: precisaCampo ? campos[0]?.id : undefined,
                                    valor: precisaValor ? '' : undefined,
                                    configuracao: undefined,
                                  })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de ação" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tiposAcao.map((tipo) => (
                                    <SelectItem key={tipo.id} value={tipo.id}>
                                      {tipo.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {requiresCampo && (
                              <div className="space-y-2">
                                <Label>Campo</Label>
                                <Select
                                  value={acao.campoId ?? ''}
                                  onValueChange={(valor) =>
                                    atualizarAcao(index, {
                                      ...acao,
                                      campoId: valor || undefined,
                                    })
                                  }
                                >
                                  <SelectTrigger
                                    className={
                                      erros[`acao_${index}_campo`] ? 'border-destructive' : ''
                                    }
                                  >
                                    <SelectValue placeholder="Selecione o campo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {campos.map((campo) => (
                                      <SelectItem key={campo.id} value={campo.id}>
                                        {campo.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {requiresValor && (
                              <div className="space-y-2">
                                <Label>Valor</Label>
                                <Input
                                  value={acao.valor ?? ''}
                                  onChange={(e) =>
                                    atualizarAcao(index, {
                                      ...acao,
                                      valor: e.target.value,
                                    })
                                  }
                                  placeholder="Digite o valor"
                                  className={
                                    erros[`acao_${index}_valor`] ? 'border-destructive' : ''
                                  }
                                />
                              </div>
                            )}
                          </div>

                          {requiresConfiguracao && (
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-sm text-muted-foreground">
                                Configurações adicionais serão necessárias
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerAcao(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={atualizarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button variant="gradient" onClick={handleSubmit} disabled={atualizarMutation.isPending}>
            {atualizarMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
