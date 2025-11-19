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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Plus, Trash2, Zap, AlertCircle } from 'lucide-react'
import { useMutation, useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  criarRegra,
  type CriarRegraPayload,
  type CondicaoRegraInput,
  type AcaoRegraInput,
} from '@/lib/automacao-api'
import { getCatalogItemsBySlug, type CatalogItem } from '@/lib/catalogos-api'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { cn } from '@/lib/utils'

interface ModalCriarRegraProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

type InputConfig = {
  inputType: string
  valueType: string
  optionsCategory?: string
  placeholder?: string
  helperText?: string
}

const parseInputConfig = (meta?: Record<string, unknown> | null): InputConfig => ({
  inputType: typeof meta?.inputType === 'string' ? (meta.inputType as string) : 'text',
  valueType: typeof meta?.valueType === 'string' ? (meta.valueType as string) : 'string',
  optionsCategory:
    typeof meta?.optionsCategory === 'string' ? (meta.optionsCategory as string) : undefined,
  placeholder: typeof meta?.placeholder === 'string' ? (meta.placeholder as string) : undefined,
  helperText: typeof meta?.helperText === 'string' ? (meta.helperText as string) : undefined,
})

const getDefaultValueForConfig = (config: InputConfig): unknown => {
  if (config.inputType === 'multiselect') {
    return []
  }
  return ''
}

const ensureValueShape = (value: unknown, config: InputConfig): unknown => {
  if (config.inputType === 'multiselect') {
    if (Array.isArray(value)) {
      return value.map((item) => String(item))
    }
    if (value === undefined || value === null || value === '') {
      return []
    }
    return [String(value)]
  }

  if (config.valueType === 'number') {
    if (value === undefined || value === null) return ''
    return String(value)
  }

  if (config.valueType === 'boolean') {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }
    if (typeof value === 'string') {
      return value
    }
    return ''
  }

  return value ?? ''
}

const isValueEmpty = (value: unknown, config: InputConfig): boolean => {
  if (config.inputType === 'multiselect') {
    return !Array.isArray(value) || value.length === 0
  }

  if (config.valueType === 'number') {
    if (value === undefined || value === null) return true
    if (typeof value === 'string') return value.trim().length === 0
    return false
  }

  if (config.valueType === 'boolean') {
    if (typeof value === 'boolean') return false
    if (typeof value === 'string') return value.trim().length === 0
    return true
  }

  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim().length === 0)
  )
}

const serializeValueForSubmission = (value: unknown, config: InputConfig): unknown => {
  if (value === undefined || value === null) return undefined

  if (config.inputType === 'multiselect') {
    if (Array.isArray(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return [value]
    }
    return undefined
  }

  if (config.valueType === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  if (config.valueType === 'boolean') {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase()
      if (['true', '1', 'sim', 'yes'].includes(normalized)) return true
      if (['false', '0', 'não', 'nao', 'no'].includes(normalized)) return false
    }
    return undefined
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return undefined
  }

  return value
}

const getOptionValue = (item: CatalogItem): string => {
  const legacy = (item.metadata as Record<string, unknown> | null)?.legacyValue
  if (typeof legacy === 'string' && legacy.trim().length > 0) {
    return legacy
  }
  return item.slug
}

export function ModalCriarRegra({ open, onOpenChange, onSuccess }: ModalCriarRegraProps) {
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [ativo, setAtivo] = React.useState(true)
  const [ordem, setOrdem] = React.useState('0')
  const [condicoes, setCondicoes] = React.useState<CondicaoFormValue[]>([])
  const [acoes, setAcoes] = React.useState<AcaoFormValue[]>([])
  const [erros, setErros] = React.useState<Record<string, string>>({})

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

  const camposMap = React.useMemo(() => {
    const map = new Map<string, CatalogOption>()
    campos.forEach((campo) => map.set(campo.id, campo))
    return map
  }, [campos])

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

  const operadoresMap = React.useMemo(() => {
    return new Map(operadores.map((op) => [op.id, op]))
  }, [operadores])

  const tiposAcaoMap = React.useMemo(() => {
    return new Map(tiposAcao.map((acao) => [acao.id, acao]))
  }, [tiposAcao])

  const optionSlugs = React.useMemo(() => {
    const slugs = new Set<string>()
    campos.forEach((campo) => {
      const metadata = campo.metadata as Record<string, unknown> | null
      const optionsCategory =
        typeof metadata?.optionsCategory === 'string'
          ? (metadata.optionsCategory as string)
          : undefined
      if (optionsCategory) {
        slugs.add(optionsCategory)
      }
    })
    tiposAcao.forEach((acao) => {
      const metadata = acao.metadata as Record<string, unknown> | null
      const optionsCategory =
        typeof metadata?.optionsCategory === 'string'
          ? (metadata.optionsCategory as string)
          : undefined
      if (optionsCategory) {
        slugs.add(optionsCategory)
      }
    })
    return Array.from(slugs)
  }, [campos, tiposAcao])

  const optionQueries = useQueries({
    queries: optionSlugs.map((slug) => ({
      queryKey: ['catalog-options', slug],
      queryFn: () => getCatalogItemsBySlug(slug, { includeInativos: false }),
      enabled: Boolean(slug) && open,
      staleTime: 1000 * 60 * 5,
    })),
  })

  const optionsBySlug = React.useMemo(() => {
    const map = new Map<string, CatalogItem[]>()
    optionSlugs.forEach((slug, index) => {
      const data = optionQueries[index]?.data ?? []
      map.set(slug, data)
    })
    return map
  }, [optionSlugs, optionQueries])

  const getOptionsForSlug = React.useCallback(
    (slug?: string) => {
      if (!slug) return [] as CatalogItem[]
      return optionsBySlug.get(slug) ?? []
    },
    [optionsBySlug],
  )

  // Mutation para criar regra
  const criarMutation = useMutation({
    mutationFn: (payload: CriarRegraPayload) => criarRegra(payload),
    onSuccess: () => {
      toast.success('Regra criada com sucesso!')
      onSuccess()
      resetForm()
    },
    onError: () => {
      toast.error('Erro ao criar regra')
    },
  })

  const resetForm = () => {
    setNome('')
    setDescricao('')
    setAtivo(true)
    setOrdem('0')
    setCondicoes([])
    setAcoes([])
    setErros({})
  }

  const adicionarCondicao = React.useCallback(() => {
    if (campos.length === 0 || operadores.length === 0) {
      toast.error('Configure campos e operadores nos catálogos antes de criar condições.')
      return
    }

    const campoDefault = campos[0]
    const operadorDefault = operadores[0]
    const campoMeta = campoDefault.metadata as Record<string, unknown> | null
    const campoConfig = parseInputConfig(campoMeta)
    const operadorMeta = operadoresMap.get(operadorDefault.id)?.metadata as Record<
      string,
      unknown
    > | null
    const requiresValor =
      typeof operadorMeta?.requiresValue === 'boolean'
        ? (operadorMeta.requiresValue as boolean)
        : true

    setCondicoes((prev) => [
      ...prev,
      {
        campoId: campoDefault.id,
        operadorId: operadorDefault.id,
        valor: requiresValor ? getDefaultValueForConfig(campoConfig) : undefined,
        logica: 'E',
      },
    ])
  }, [campos, operadores, operadoresMap])

  const removerCondicao = React.useCallback((index: number) => {
    setCondicoes((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const atualizarCondicao = React.useCallback(
    (index: number, condicao: CondicaoFormValue) => {
      setCondicoes((prev) => {
        const novas = [...prev]
        const campoMeta = camposMap.get(condicao.campoId ?? '')?.metadata as Record<
          string,
          unknown
        > | null
        const campoConfig = parseInputConfig(campoMeta)
        const operadorMeta = operadoresMap.get(condicao.operadorId ?? '')?.metadata as Record<
          string,
          unknown
        > | null
        const requiresValor =
          typeof operadorMeta?.requiresValue === 'boolean'
            ? (operadorMeta.requiresValue as boolean)
            : true

        novas[index] = {
          campoId: condicao.campoId,
          operadorId: condicao.operadorId,
          valor: requiresValor ? ensureValueShape(condicao.valor, campoConfig) : undefined,
          logica: condicao.logica ?? 'E',
        }

        return novas
      })
    },
    [camposMap, operadoresMap],
  )

  const adicionarAcao = React.useCallback(() => {
    if (tiposAcao.length === 0) {
      toast.error('Configure tipos de ação no catálogo antes de adicionar ações.')
      return
    }

    const tipoDefault = tiposAcao[0]
    const meta = tipoDefault.metadata as Record<string, unknown> | null
    const requiresCampo = Boolean(meta?.requiresField)
    const requiresValor = Boolean(meta?.requiresValue)
    const config = parseInputConfig(meta)

    if (requiresCampo && campos.length === 0) {
      toast.error('Configure campos no catálogo antes de utilizar ações que exigem campo.')
      return
    }

    setAcoes((prev) => [
      ...prev,
      {
        tipoId: tipoDefault.id,
        campoId: requiresCampo ? campos[0]?.id : undefined,
        valor: requiresValor ? getDefaultValueForConfig(config) : undefined,
        configuracao: undefined,
      },
    ])
  }, [tiposAcao, campos])

  const removerAcao = React.useCallback((index: number) => {
    setAcoes((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const atualizarAcao = React.useCallback(
    (index: number, acao: AcaoFormValue) => {
      setAcoes((prev) => {
        const novas = [...prev]
        const tipoMeta = tiposAcaoMap.get(acao.tipoId ?? '')?.metadata as Record<
          string,
          unknown
        > | null
        const config = parseInputConfig(tipoMeta)
        const requiresValor = Boolean(tipoMeta?.requiresValue)
        const requiresCampo = Boolean(tipoMeta?.requiresField)
        const resolvedCampoId =
          requiresCampo && !acao.campoId && campos.length > 0 ? campos[0]?.id : acao.campoId

        novas[index] = {
          ...acao,
          campoId: requiresCampo ? (resolvedCampoId ?? undefined) : undefined,
          valor: requiresValor ? ensureValueShape(acao.valor, config) : undefined,
        }

        return novas
      })
    },
    [tiposAcaoMap, campos],
  )

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

      const campoMeta = camposMap.get(cond.campoId ?? '')?.metadata as Record<
        string,
        unknown
      > | null
      const campoConfig = parseInputConfig(campoMeta)
      const operadorMeta = operadoresMap.get(cond.operadorId ?? '')?.metadata as Record<
        string,
        unknown
      > | null
      const requiresValue =
        typeof operadorMeta?.requiresValue === 'boolean'
          ? (operadorMeta.requiresValue as boolean)
          : true

      if (requiresValue && isValueEmpty(cond.valor, campoConfig)) {
        novosErros[`condicao_${i}_valor`] = 'Valor é obrigatório'
      }
    })

    // Validar ações
    acoes.forEach((acao, i) => {
      const tipoMeta = tiposAcaoMap.get(acao.tipoId ?? '')?.metadata as Record<
        string,
        unknown
      > | null
      const tipoConfig = parseInputConfig(tipoMeta)
      const requiresField = Boolean(tipoMeta?.requiresField)
      const requiresValue = Boolean(tipoMeta?.requiresValue)

      if (requiresField && !acao.campoId) {
        novosErros[`acao_${i}_campo`] = 'Campo é obrigatório'
      }

      if (requiresValue && isValueEmpty(acao.valor, tipoConfig)) {
        novosErros[`acao_${i}_valor`] = 'Valor é obrigatório'
      }
    })

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = () => {
    if (!validar()) return

    const payload: CriarRegraPayload = {
      nome,
      descricao: descricao || undefined,
      condicoes: condicoes.map((cond) => {
        const campoMeta = camposMap.get(cond.campoId ?? '')?.metadata as Record<
          string,
          unknown
        > | null
        const campoConfig = parseInputConfig(campoMeta)
        const operadorMeta = operadoresMap.get(cond.operadorId ?? '')?.metadata as Record<
          string,
          unknown
        > | null
        const requiresValue =
          typeof operadorMeta?.requiresValue === 'boolean'
            ? (operadorMeta.requiresValue as boolean)
            : true

        return {
          campoId: cond.campoId,
          operadorId: cond.operadorId,
          valor: requiresValue ? serializeValueForSubmission(cond.valor, campoConfig) : undefined,
          logica: cond.logica ?? 'E',
        }
      }),
      acoes: acoes.map((acao) => {
        const tipoMeta = tiposAcaoMap.get(acao.tipoId ?? '')?.metadata as Record<
          string,
          unknown
        > | null
        const tipoConfig = parseInputConfig(tipoMeta)
        const requiresField = Boolean(tipoMeta?.requiresField)
        const requiresValue = Boolean(tipoMeta?.requiresValue)

        return {
          tipoId: acao.tipoId,
          campoId: requiresField && acao.campoId ? acao.campoId : undefined,
          valor: requiresValue ? serializeValueForSubmission(acao.valor, tipoConfig) : undefined,
          configuracao: acao.configuracao,
        }
      }),
      ativo,
      ordem: Number.parseInt(ordem, 10) || 0,
    }

    criarMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Regra de Automação</DialogTitle>
          <DialogDescription>
            Configure condições e ações que serão executadas automaticamente
          </DialogDescription>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Ativar regra</Label>
                <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
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
                const campoOption = camposMap.get(condicao.campoId ?? '')
                const campoMeta = campoOption?.metadata as Record<string, unknown> | null
                const campoConfig = parseInputConfig(campoMeta)
                const operadorMeta = operadoresMap.get(condicao.operadorId ?? '')
                  ?.metadata as Record<string, unknown> | null
                const requiresValor =
                  typeof operadorMeta?.requiresValue === 'boolean'
                    ? (operadorMeta.requiresValue as boolean)
                    : true
                const campoOptions = getOptionsForSlug(campoConfig.optionsCategory)
                const selectedMultiValues = Array.isArray(condicao.valor) ? condicao.valor : []
                const textValue =
                  typeof condicao.valor === 'string'
                    ? condicao.valor
                    : condicao.valor === undefined || condicao.valor === null
                      ? ''
                      : String(condicao.valor)
                const booleanValue =
                  campoConfig.valueType === 'boolean'
                    ? textValue === ''
                      ? undefined
                      : textValue
                    : undefined

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
                              onValueChange={(valor) =>
                                atualizarCondicao(index, {
                                  ...condicao,
                                  operadorId: valor,
                                })
                              }
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

                          <div className="space-y-2">
                            <Label>Valor</Label>
                            {!requiresValor ? (
                              <Input value="" disabled placeholder="Operador sem valor" />
                            ) : campoConfig.inputType === 'select' && campoOptions.length > 0 ? (
                              <Select
                                value={textValue}
                                onValueChange={(valor) =>
                                  atualizarCondicao(index, {
                                    ...condicao,
                                    valor,
                                  })
                                }
                              >
                                <SelectTrigger
                                  className={
                                    erros[`condicao_${index}_valor`] ? 'border-destructive' : ''
                                  }
                                >
                                  <SelectValue
                                    placeholder={campoConfig.placeholder ?? 'Selecione o valor'}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {campoOptions.map((option) => {
                                    const optionValue = getOptionValue(option)
                                    return (
                                      <SelectItem key={option.id} value={optionValue}>
                                        {option.label}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            ) : campoConfig.inputType === 'multiselect' &&
                              campoOptions.length > 0 ? (
                              <div
                                className={cn(
                                  'rounded-md border border-input p-3',
                                  erros[`condicao_${index}_valor`] && 'border-destructive',
                                )}
                              >
                                <div className="flex flex-wrap gap-3">
                                  {campoOptions.map((option) => {
                                    const optionValue = getOptionValue(option)
                                    const checked = selectedMultiValues.includes(optionValue)
                                    return (
                                      <label
                                        key={option.id}
                                        className="flex items-center gap-2 text-sm text-muted-foreground"
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(checkedState) => {
                                            const isChecked = checkedState === true
                                            const nextValues = isChecked
                                              ? [...selectedMultiValues, optionValue]
                                              : selectedMultiValues.filter(
                                                  (value) => value !== optionValue,
                                                )
                                            atualizarCondicao(index, {
                                              ...condicao,
                                              valor: nextValues,
                                            })
                                          }}
                                        />
                                        <span>{option.label}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                                {selectedMultiValues.length === 0 && (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Selecione pelo menos uma opção.
                                  </p>
                                )}
                              </div>
                            ) : campoConfig.valueType === 'boolean' ? (
                              <Select
                                value={booleanValue}
                                onValueChange={(valor) =>
                                  atualizarCondicao(index, {
                                    ...condicao,
                                    valor,
                                  })
                                }
                              >
                                <SelectTrigger
                                  className={
                                    erros[`condicao_${index}_valor`] ? 'border-destructive' : ''
                                  }
                                >
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Sim</SelectItem>
                                  <SelectItem value="false">Não</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={campoConfig.valueType === 'number' ? 'number' : 'text'}
                                value={textValue}
                                onChange={(e) =>
                                  atualizarCondicao(index, {
                                    ...condicao,
                                    valor: e.target.value,
                                  })
                                }
                                placeholder={campoConfig.placeholder ?? 'Digite o valor'}
                                className={
                                  erros[`condicao_${index}_valor`] ? 'border-destructive' : ''
                                }
                              />
                            )}
                            {campoConfig.inputType === 'select' &&
                              campoOptions.length === 0 &&
                              requiresValor && (
                                <p className="text-xs text-muted-foreground">
                                  Nenhum item disponível no catálogo {campoConfig.optionsCategory}.
                                  Ajuste o catálogo ou informe um valor manualmente.
                                </p>
                              )}
                            {campoConfig.helperText && (
                              <p className="text-xs text-muted-foreground">
                                {campoConfig.helperText}
                              </p>
                            )}
                          </div>
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
                const tipoMeta = tiposAcaoMap.get(acao.tipoId ?? '')?.metadata as Record<
                  string,
                  unknown
                > | null
                const tipoConfig = parseInputConfig(tipoMeta)
                const requiresCampo = Boolean(tipoMeta?.requiresField)
                const requiresValor = Boolean(tipoMeta?.requiresValue)
                const requiresConfiguracao = Boolean(tipoMeta?.requiresConfig)
                const actionOptions = getOptionsForSlug(tipoConfig.optionsCategory)
                const selectedMultiValues = Array.isArray(acao.valor) ? acao.valor : []
                const textValue =
                  typeof acao.valor === 'string'
                    ? acao.valor
                    : acao.valor === undefined || acao.valor === null
                      ? ''
                      : String(acao.valor)
                const booleanValue =
                  tipoConfig.valueType === 'boolean'
                    ? textValue === ''
                      ? undefined
                      : textValue
                    : undefined

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
                                onValueChange={(valor) =>
                                  atualizarAcao(index, {
                                    ...acao,
                                    tipoId: valor,
                                    valor: undefined,
                                    configuracao: undefined,
                                  })
                                }
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
                                {tipoConfig.inputType === 'select' && actionOptions.length > 0 ? (
                                  <Select
                                    value={textValue}
                                    onValueChange={(valor) =>
                                      atualizarAcao(index, {
                                        ...acao,
                                        valor,
                                      })
                                    }
                                  >
                                    <SelectTrigger
                                      className={
                                        erros[`acao_${index}_valor`] ? 'border-destructive' : ''
                                      }
                                    >
                                      <SelectValue
                                        placeholder={tipoConfig.placeholder ?? 'Selecione o valor'}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {actionOptions.map((option) => {
                                        const optionValue = getOptionValue(option)
                                        return (
                                          <SelectItem key={option.id} value={optionValue}>
                                            {option.label}
                                          </SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                ) : tipoConfig.inputType === 'multiselect' &&
                                  actionOptions.length > 0 ? (
                                  <div
                                    className={cn(
                                      'rounded-md border border-input p-3',
                                      erros[`acao_${index}_valor`] && 'border-destructive',
                                    )}
                                  >
                                    <div className="flex flex-wrap gap-3">
                                      {actionOptions.map((option) => {
                                        const optionValue = getOptionValue(option)
                                        const checked = selectedMultiValues.includes(optionValue)
                                        return (
                                          <label
                                            key={option.id}
                                            className="flex items-center gap-2 text-sm text-muted-foreground"
                                          >
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(checkedState) => {
                                                const isChecked = checkedState === true
                                                const nextValues = isChecked
                                                  ? [...selectedMultiValues, optionValue]
                                                  : selectedMultiValues.filter(
                                                      (value) => value !== optionValue,
                                                    )
                                                atualizarAcao(index, {
                                                  ...acao,
                                                  valor: nextValues,
                                                })
                                              }}
                                            />
                                            <span>{option.label}</span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                    {selectedMultiValues.length === 0 && (
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        Selecione pelo menos uma opção.
                                      </p>
                                    )}
                                  </div>
                                ) : tipoConfig.valueType === 'boolean' ? (
                                  <Select
                                    value={booleanValue}
                                    onValueChange={(valor) =>
                                      atualizarAcao(index, {
                                        ...acao,
                                        valor,
                                      })
                                    }
                                  >
                                    <SelectTrigger
                                      className={
                                        erros[`acao_${index}_valor`] ? 'border-destructive' : ''
                                      }
                                    >
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">Sim</SelectItem>
                                      <SelectItem value="false">Não</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    type={tipoConfig.valueType === 'number' ? 'number' : 'text'}
                                    value={textValue}
                                    onChange={(e) =>
                                      atualizarAcao(index, {
                                        ...acao,
                                        valor: e.target.value,
                                      })
                                    }
                                    placeholder={tipoConfig.placeholder ?? 'Digite o valor'}
                                    className={
                                      erros[`acao_${index}_valor`] ? 'border-destructive' : ''
                                    }
                                  />
                                )}
                                {tipoConfig.inputType === 'select' &&
                                  actionOptions.length === 0 &&
                                  requiresValor && (
                                    <p className="text-xs text-muted-foreground">
                                      Nenhum item disponível no catálogo{' '}
                                      {tipoConfig.optionsCategory}. Ajuste o catálogo ou informe um
                                      valor manualmente.
                                    </p>
                                  )}
                                {tipoConfig.helperText && (
                                  <p className="text-xs text-muted-foreground">
                                    {tipoConfig.helperText}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {requiresConfiguracao && (
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-sm text-muted-foreground">
                                Configurações adicionais serão necessárias após criar a regra
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
            disabled={criarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button variant="gradient" onClick={handleSubmit} disabled={criarMutation.isPending}>
            {criarMutation.isPending ? 'Criando...' : 'Criar Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
