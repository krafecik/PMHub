'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Info,
  Archive,
  Copy,
  Rocket,
  Timer,
  Keyboard,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  RotateCcw,
  Save,
  Lightbulb,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TriagemChecklist } from './TriagemChecklist'
import type { DemandaPendenteTriagem, DemandaTriagem } from '@/lib/triagem-api'
import {
  obterSugestoesTriagem,
  obterSinaisTriagem,
  type TriagemSugestao,
  type TriagemSinal,
  obterHistoricoSolucoes,
  type HistoricoSolucao,
  gerarSugestaoEncaminhamentoIa,
  type SugestaoEncaminhamentoIa,
} from '@/lib/triagem-api'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SugestoesPainel } from './sugestoes-painel'
import { SinaisPainel } from './sinais-painel'
import { HistoricoSolucoes } from './historico-solucoes'
import { cn } from '@/lib/utils'
import {
  useTriagemCatalogOptions,
  getMetadataNumber,
  getMetadataString,
  TriagemOption,
} from '@/hooks/use-triagem-catalogos'

interface ModoFocoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandas: DemandaPendenteTriagem[]
  onTriar: (demandaId: string, payload: any) => Promise<void>
  onSalvar?: (demandaId: string, payload: any) => Promise<void>
  onSolicitarInfo: (demandaId: string) => void
  onMarcarDuplicata: (demandaId: string) => void
  onArquivar: (demandaId: string) => void
  onVirarEpico: (demandaId: string) => void
}

type OptionWithShortcut = TriagemOption & { shortcut: string }

const assignShortcuts = (options: TriagemOption[]): OptionWithShortcut[] => {
  const shortcuts = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  return options.map((option, index) => ({
    ...option,
    shortcut: shortcuts[index] ?? String(index + 1),
  }))
}

const normalizeValue = (value?: string) => (value ?? '').toString().toUpperCase()

const FALLBACK_WEIGHT_BY_SLUG: Record<string, number> = {
  baixo: 1,
  baixa: 1,
  medio: 2,
  media: 2,
  alto: 3,
  alta: 3,
  critico: 4,
}

const SELECTED_CLASSES_BY_SLUG: Record<string, string> = {
  critico:
    'border-2 border-destructive bg-destructive text-destructive-foreground font-semibold shadow-lg shadow-destructive/30 scale-105 ring-2 ring-destructive/20',
  alto: 'border-2 border-warning bg-warning text-warning-foreground font-semibold shadow-lg shadow-warning/30 scale-105 ring-2 ring-warning/20',
  alta: 'border-2 border-warning bg-warning text-warning-foreground font-semibold shadow-lg shadow-warning/30 scale-105 ring-2 ring-warning/20',
  medio:
    'border-2 border-secondary bg-secondary text-secondary-foreground font-semibold shadow-lg shadow-secondary/30 scale-105 ring-2 ring-secondary/20',
  media:
    'border-2 border-secondary bg-secondary text-secondary-foreground font-semibold shadow-lg shadow-secondary/30 scale-105 ring-2 ring-secondary/20',
  baixo:
    'border-2 border-primary bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20',
  baixa:
    'border-2 border-primary bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20',
}

const resolveSelectedClasses = (option: TriagemOption, isSelected: boolean) => {
  if (!isSelected) return ''
  return (
    SELECTED_CLASSES_BY_SLUG[option.slug.toLowerCase()] ??
    'border-2 border-primary bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20'
  )
}

const resolveBadgeVariant = (option?: TriagemOption) => {
  const allowed = new Set([
    'default',
    'secondary',
    'destructive',
    'outline',
    'success',
    'warning',
    'info',
  ])
  const metaVariant = getMetadataString(option, 'badgeVariant')
  if (metaVariant && allowed.has(metaVariant)) {
    return metaVariant as
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline'
      | 'success'
      | 'warning'
      | 'info'
  }
  return 'outline'
}

const resolveWeight = (option?: TriagemOption) => {
  if (!option) return 0
  const weight = getMetadataNumber(option, 'weight')
  if (typeof weight === 'number') return weight
  return FALLBACK_WEIGHT_BY_SLUG[option.slug.toLowerCase()] ?? 0
}

export function ModoFoco({
  open,
  onOpenChange,
  demandas,
  onTriar,
  onSalvar,
  onSolicitarInfo,
  onMarcarDuplicata,
  onArquivar,
  onVirarEpico,
}: ModoFocoProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [impacto, setImpacto] = React.useState('')
  const [urgencia, setUrgencia] = React.useState('')
  const [complexidade, setComplexidade] = React.useState('')
  const [observacoes, setObservacoes] = React.useState('')
  const [checklistValid, setChecklistValid] = React.useState(false)
  const [checklistUpdates, setChecklistUpdates] = React.useState<
    Array<{ itemId: string; completed: boolean }>
  >([])
  const [showHelp, setShowHelp] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [focusField, setFocusField] = React.useState<
    'impacto' | 'urgencia' | 'complexidade' | null
  >('impacto')
  const [encaminhamentoIa, setEncaminhamentoIa] = React.useState<SugestaoEncaminhamentoIa | null>(
    null,
  )

  const currentDemanda = demandas[currentIndex]
  const currentDemandaId = currentDemanda?.id

  const { data: sugestoesResponse, isLoading: sugestoesLoading } = useQuery({
    queryKey: ['triagem', 'sugestoes', currentDemandaId, 'modo-foco'],
    queryFn: () => obterSugestoesTriagem(currentDemandaId!),
    enabled: open && Boolean(currentDemandaId),
    staleTime: 1000 * 45,
  })

  const { data: sinaisResponse, isLoading: sinaisLoading } = useQuery({
    queryKey: ['triagem', 'sinais', currentDemandaId, 'modo-foco'],
    queryFn: () => obterSinaisTriagem(currentDemandaId!),
    enabled: open && Boolean(currentDemandaId),
    staleTime: 1000 * 30,
  })

  const sugestoes: TriagemSugestao[] = React.useMemo(
    () => sugestoesResponse?.sugestoes ?? [],
    [sugestoesResponse?.sugestoes],
  )
  const sinais: TriagemSinal[] = sinaisResponse?.sinais ?? []
  const { data: historicoResponse, isLoading: historicoLoading } = useQuery({
    queryKey: ['triagem', 'historico', currentDemandaId, 'modo-foco'],
    queryFn: () => obterHistoricoSolucoes(currentDemandaId!),
    enabled: open && Boolean(currentDemandaId),
    staleTime: 1000 * 60,
  })
  const historico: HistoricoSolucao[] = historicoResponse?.historico ?? []

  const triagemCatalogs = useTriagemCatalogOptions()

  const impactoOptions = React.useMemo(
    () => assignShortcuts(triagemCatalogs.impacto.options),
    [triagemCatalogs.impacto.options],
  )
  const urgenciaOptions = React.useMemo(
    () => assignShortcuts(triagemCatalogs.urgencia.options),
    [triagemCatalogs.urgencia.options],
  )
  const complexidadeOptions = React.useMemo(
    () => assignShortcuts(triagemCatalogs.complexidade.options),
    [triagemCatalogs.complexidade.options],
  )
  const impactoNormalized = normalizeValue(impacto)
  const complexidadeNormalized = normalizeValue(complexidade)
  const urgenciaNormalized = normalizeValue(urgencia)

  const impactoOption = triagemCatalogs.impacto.map.get(impactoNormalized)
  const urgenciaOption = triagemCatalogs.urgencia.map.get(urgenciaNormalized)
  const complexidadeOption = triagemCatalogs.complexidade.map.get(complexidadeNormalized)

  const impactoWeight = resolveWeight(impactoOption)
  const urgenciaWeight = resolveWeight(urgenciaOption)
  const complexidadeWeight = resolveWeight(complexidadeOption)

  const epicThreshold = Math.max(
    getMetadataNumber(impactoOption, 'epicThreshold') ?? 3,
    getMetadataNumber(complexidadeOption, 'epicThreshold') ?? 3,
  )
  const shouldSuggestEpico = impactoWeight >= epicThreshold || complexidadeWeight >= epicThreshold
  const epicHint =
    getMetadataString(impactoOption, 'epicHint') ??
    getMetadataString(complexidadeOption, 'epicHint') ??
    'Impacto ou complexidade acima do limite sugerido.'

  const selectedImpactoDescription = getMetadataString(impactoOption, 'description')
  const selectedUrgenciaDescription = getMetadataString(urgenciaOption, 'description')
  const selectedComplexidadeDescription = getMetadataString(complexidadeOption, 'description')
  const hasImpactoDescription = Boolean(selectedImpactoDescription)
  const hasUrgenciaDescription = Boolean(selectedUrgenciaDescription)
  const hasComplexidadeDescription = Boolean(selectedComplexidadeDescription)

  const severityScore = impactoWeight * Math.max(1, urgenciaWeight)
  let severityLabel = 'Média'
  let severityVariant: 'secondary' | 'warning' | 'destructive' = 'secondary'
  if (severityScore >= 12) {
    severityLabel = 'Crítica'
    severityVariant = 'destructive'
  } else if (severityScore >= 9) {
    severityLabel = 'Alta'
    severityVariant = 'warning'
  } else if (severityScore <= 4) {
    severityLabel = 'Baixa'
    severityVariant = 'secondary'
  }

  // Reset fields quando mudar de demanda
  React.useEffect(() => {
    if (currentDemanda) {
      setImpacto(currentDemanda.triagem?.impacto || '')
      setUrgencia(currentDemanda.triagem?.urgencia || '')
      setComplexidade(currentDemanda.triagem?.complexidade || '')
      setObservacoes('')
      setChecklistUpdates([])
      setFocusField('impacto')
    }
  }, [currentIndex, currentDemanda])

  React.useEffect(() => {
    if (!impacto && impactoOptions.length > 0) {
      setImpacto(impactoOptions[0].value)
    }
  }, [impactoOptions, impacto])

  React.useEffect(() => {
    if (!urgencia && urgenciaOptions.length > 0) {
      setUrgencia(urgenciaOptions[0].value)
    }
  }, [urgenciaOptions, urgencia])

  React.useEffect(() => {
    if (!complexidade && complexidadeOptions.length > 0) {
      setComplexidade(complexidadeOptions[0].value)
    }
  }, [complexidadeOptions, complexidade])

  // Converter para DemandaTriagem para o checklist
  const duplicatasSugeridas = React.useMemo(() => {
    const sugestaoDuplicatas = sugestoes.find((item) => item.tipo === 'duplicatas')
    if (!sugestaoDuplicatas?.relacionados) return []
    return sugestaoDuplicatas.relacionados.map((relacionado) => ({
      id: relacionado.id,
      titulo: relacionado.titulo,
      similaridade: parseInt(relacionado.referencia?.replace(/\D+/g, '') ?? '0', 10),
    }))
  }, [sugestoes])

  const demandaParaChecklist: DemandaTriagem | null = currentDemanda
    ? {
        id: currentDemanda.id,
        titulo: currentDemanda.titulo,
        descricao: currentDemanda.descricao,
        tipo: currentDemanda.tipo,
        origem: currentDemanda.origem,
        produtoId: currentDemanda.produto?.id || null,
        triagem: {
          id: currentDemanda.triagem.id,
          status: currentDemanda.triagem.status,
          impacto,
          urgencia,
          complexidade,
          duplicatasRevisadas: currentDemanda.triagem.possivelDuplicata === false,
        },
        duplicatasSugeridas,
        anexos: [],
      }
    : null

  const canSubmit = checklistValid && impacto && urgencia && complexidade

  // Mutation para gerar sugestão de encaminhamento com IA
  const gerarEncaminhamentoMutation = useMutation({
    mutationFn: async () => {
      if (!currentDemandaId) return null
      return gerarSugestaoEncaminhamentoIa(currentDemandaId)
    },
    onSuccess: (result) => {
      if (result) {
        setEncaminhamentoIa(result)
        toast.success('Sugestão gerada com IA')
      }
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Não foi possível gerar a sugestão com IA.')
    },
  })

  const resumoAcaoIa = React.useMemo(() => {
    if (!encaminhamentoIa) return null
    const labels: Record<SugestaoEncaminhamentoIa['acaoRecomendada'], string> = {
      ENVIAR_DISCOVERY: 'Enviar para Discovery',
      SOLICITAR_INFO: 'Solicitar Informações',
      ARQUIVAR: 'Arquivar Demanda',
      VIRAR_EPICO: 'Evoluir para Épico',
      AGUARDAR: 'Aguardar mais dados',
    }
    return labels[encaminhamentoIa.acaoRecomendada]
  }, [encaminhamentoIa])

  // Resetar encaminhamentoIa quando mudar de demanda
  React.useEffect(() => {
    setEncaminhamentoIa(null)
  }, [currentDemandaId])

  const handleNext = React.useCallback(() => {
    setCurrentIndex((prev) => {
      const lastIndex = demandas.length - 1
      return prev < lastIndex ? prev + 1 : prev
    })
  }, [demandas.length])

  const handlePrev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const handleSalvar = React.useCallback(async () => {
    if (!currentDemanda || !onSalvar) return

    try {
      setIsSaving(true)
      await onSalvar(currentDemanda.id, {
        impacto: impacto || undefined,
        urgencia: urgencia || undefined,
        complexidade: complexidade || undefined,
        observacoes: observacoes.trim() || undefined,
        checklistAtualizacoes: checklistUpdates.length > 0 ? checklistUpdates : undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }, [currentDemanda, impacto, urgencia, complexidade, observacoes, checklistUpdates, onSalvar])

  const handleTriar = React.useCallback(async () => {
    if (!currentDemanda || !canSubmit) return

    await onTriar(currentDemanda.id, {
      novoStatus: 'PRONTO_DISCOVERY',
      impacto,
      urgencia,
      complexidade,
      observacoes: observacoes.trim() || undefined,
      checklistAtualizacoes: checklistUpdates.length > 0 ? checklistUpdates : undefined,
    })

    setCurrentIndex((prev) => {
      const lastIndex = demandas.length - 1
      if (prev < lastIndex) {
        return prev + 1
      }
      onOpenChange(false)
      return prev
    })
  }, [
    canSubmit,
    complexidade,
    currentDemanda,
    demandas.length,
    impacto,
    observacoes,
    checklistUpdates,
    onOpenChange,
    onTriar,
    urgencia,
  ])

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um campo
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'j':
        case 'J':
          e.preventDefault()
          handleNext()
          break
        case 'ArrowLeft':
        case 'k':
        case 'K':
          e.preventDefault()
          handlePrev()
          break
        case 'e':
        case 'E':
          e.preventDefault()
          if (canSubmit && !e.shiftKey) handleTriar()
          break
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (onSalvar) handleSalvar()
          } else {
            e.preventDefault()
            onSolicitarInfo(currentDemanda.id)
          }
          break
        case 'i':
        case 'I':
          e.preventDefault()
          setFocusField('impacto')
          break
        case 'u':
        case 'U':
          e.preventDefault()
          setFocusField('urgencia')
          break
        case 'c':
        case 'C':
          e.preventDefault()
          setFocusField('complexidade')
          break
        case 'd':
        case 'D':
          e.preventDefault()
          if (currentDemanda.triagem.possivelDuplicata) {
            onMarcarDuplicata(currentDemanda.id)
          }
          break
        case 'a':
        case 'A':
          e.preventDefault()
          onArquivar(currentDemanda.id)
          handleNext()
          break
        case '?':
        case 'h':
        case 'H':
          e.preventDefault()
          setShowHelp(!showHelp)
          break
        case 'Escape':
          if (showHelp) {
            setShowHelp(false)
          } else {
            onOpenChange(false)
          }
          break
      }

      // Atalhos numéricos para campos focados
      if (focusField) {
        let options: OptionWithShortcut[] = []
        switch (focusField) {
          case 'impacto':
            options = impactoOptions
            break
          case 'urgencia':
            options = urgenciaOptions
            break
          case 'complexidade':
            options = complexidadeOptions
            break
        }
        if (!options.some((option) => option.shortcut === e.key)) {
          return
        }
        e.preventDefault()
        const option = options.find((o) => o.shortcut === e.key)
        if (option) {
          switch (focusField) {
            case 'impacto':
              setImpacto(option.value)
              setFocusField('urgencia')
              break
            case 'urgencia':
              setUrgencia(option.value)
              setFocusField('complexidade')
              break
            case 'complexidade':
              setComplexidade(option.value)
              setFocusField(null)
              break
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    open,
    currentIndex,
    canSubmit,
    currentDemanda,
    focusField,
    showHelp,
    handleNext,
    handlePrev,
    handleTriar,
    handleSalvar,
    onSalvar,
    impactoOptions,
    urgenciaOptions,
    complexidadeOptions,
    onSolicitarInfo,
    onMarcarDuplicata,
    onArquivar,
    onOpenChange,
  ])

  if (!currentDemanda || !demandaParaChecklist) return null

  const progress = ((currentIndex + 1) / demandas.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[95vh] w-[98vw] max-w-[98vw] overflow-hidden p-0 [&>button]:hidden"
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          onOpenChange(false)
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault()
          onOpenChange(false)
        }}
      >
        <DialogHeader className="border-b bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 dark:from-primary-900/20 dark:to-primary-800/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Timer className="h-6 w-6" />
                Modo Foco - Triagem Rápida
              </DialogTitle>
              <DialogDescription>
                Triagem {currentIndex + 1} de {demandas.length} • Use o teclado para navegar
              </DialogDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
                <Keyboard className="mr-2 h-4 w-4" />
                Atalhos (?)
              </Button>
              <Progress value={progress} className="w-32" />
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(95vh-80px)] overflow-hidden">
          {/* Conteúdo principal */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDemanda.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header da demanda */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{currentDemanda.id}</Badge>
                      <Badge variant="secondary">{currentDemanda.tipoLabel}</Badge>
                      <Badge variant="outline">{currentDemanda.produto.nome}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentDemanda.origemLabel} • Há {currentDemanda.triagem.diasEmTriagem} dias
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold">{currentDemanda.titulo}</h2>
                  {currentDemanda.descricao && (
                    <div className="mt-3">
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                        Descrição Detalhada
                      </h3>
                      <ScrollArea className="h-[400px] rounded-lg border p-4">
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&_h1]:my-4 [&_h2]:my-3 [&_h3]:my-2 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:my-2 [&_p]:my-2 [&_ul]:my-2"
                          dangerouslySetInnerHTML={{ __html: currentDemanda.descricao }}
                        />
                      </ScrollArea>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {impactoOption && (
                      <Badge variant={resolveBadgeVariant(impactoOption)}>
                        Impacto: {impactoOption.label}
                      </Badge>
                    )}
                    {urgenciaOption && (
                      <Badge variant={resolveBadgeVariant(urgenciaOption)}>
                        Urgência: {urgenciaOption.label}
                      </Badge>
                    )}
                    {complexidadeOption && (
                      <Badge variant={resolveBadgeVariant(complexidadeOption)}>
                        Complexidade: {complexidadeOption.label}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Assistente IA */}
                <div className="mb-6 rounded-lg border border-primary-200/60 bg-primary-50/60 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                        Assistente IA — Próximo Passo Sugerido
                      </p>
                      <p className="text-xs text-primary-700 dark:text-primary-200">
                        Gera recomendações considerando impacto, urgência e histórico da demanda.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => gerarEncaminhamentoMutation.mutate()}
                      disabled={gerarEncaminhamentoMutation.isPending}
                    >
                      {gerarEncaminhamentoMutation.isPending ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-500" />
                      ) : (
                        <Lightbulb className="mr-2 h-4 w-4" />
                      )}
                      {encaminhamentoIa ? 'Regerar sugestão' : 'Gerar sugestão IA'}
                    </Button>
                  </div>

                  {encaminhamentoIa && (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="success" className="uppercase tracking-wide">
                          {resumoAcaoIa}
                        </Badge>
                        <span className="text-xs text-primary-700 dark:text-primary-200">
                          Recomendação baseada em boas práticas de Product Management
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-primary-900 dark:text-primary-100">
                        {encaminhamentoIa.justificativa}
                      </p>
                      {encaminhamentoIa.checklist?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                            Checklist sugerido
                          </p>
                          <ul className="mt-1 space-y-1 text-xs text-primary-800 dark:text-primary-200">
                            {encaminhamentoIa.checklist.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span>•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Painel de sinais
                    </h3>
                    <SinaisPainel sinais={sinais} loading={sinaisLoading} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Sugestões do sistema
                    </h3>
                    <SugestoesPainel sugestoes={sugestoes} loading={sugestoesLoading} />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Histórico de soluções parecidas
                  </h3>
                  <HistoricoSolucoes historico={historico} loading={historicoLoading} />
                </div>

                <Separator className="mb-6" />

                {/* Avaliações rápidas */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div
                    className={cn(
                      'space-y-2',
                      focusField === 'impacto' && 'ring-primary rounded-lg p-3 ring-2',
                    )}
                  >
                    <label className="flex items-center gap-2 text-sm font-medium">
                      Impacto{' '}
                      <kbd className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">I</kbd>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {impactoOptions.map((option) => {
                        const isSelected = impacto === option.value
                        return (
                          <Button
                            key={option.value}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setImpacto(option.value)
                              setFocusField('urgencia')
                            }}
                            className={cn(
                              'justify-between transition-all duration-200',
                              isSelected
                                ? resolveSelectedClasses(option, isSelected)
                                : 'hover:bg-secondary/50',
                            )}
                          >
                            {option.label}
                            <kbd className="ml-2 text-xs">{option.shortcut}</kbd>
                          </Button>
                        )
                      })}
                      {hasImpactoDescription && (
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {selectedImpactoDescription}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'space-y-2',
                      focusField === 'urgencia' && 'ring-primary rounded-lg p-3 ring-2',
                    )}
                  >
                    <label className="flex items-center gap-2 text-sm font-medium">
                      Urgência{' '}
                      <kbd className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">U</kbd>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {urgenciaOptions.map((option) => {
                        const isSelected = urgencia === option.value
                        return (
                          <Button
                            key={option.value}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setUrgencia(option.value)
                              setFocusField('complexidade')
                            }}
                            className={cn(
                              'justify-between transition-all duration-200',
                              isSelected
                                ? resolveSelectedClasses(option, isSelected)
                                : 'hover:bg-secondary/50',
                            )}
                          >
                            {option.label}
                            <kbd className="ml-2 text-xs">{option.shortcut}</kbd>
                          </Button>
                        )
                      })}
                      {hasUrgenciaDescription && (
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {selectedUrgenciaDescription}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'space-y-2',
                      focusField === 'complexidade' && 'ring-primary rounded-lg p-3 ring-2',
                    )}
                  >
                    <label className="flex items-center gap-2 text-sm font-medium">
                      Complexidade{' '}
                      <kbd className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">C</kbd>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {complexidadeOptions.map((option) => {
                        const isSelected = complexidade === option.value
                        return (
                          <Button
                            key={option.value}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setComplexidade(option.value)
                              setFocusField(null)
                            }}
                            className={cn(
                              'justify-between transition-all duration-200',
                              isSelected
                                ? resolveSelectedClasses(option, isSelected)
                                : 'hover:bg-secondary/50',
                            )}
                          >
                            {option.label}
                            <kbd className="ml-2 text-xs">{option.shortcut}</kbd>
                          </Button>
                        )
                      })}
                      {hasComplexidadeDescription && (
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {selectedComplexidadeDescription}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(impacto || urgencia || complexidade) && (
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 bg-secondary-50/50 px-4 py-3 dark:bg-secondary-900/10">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Gravidade da demanda (auto)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Peso impacto {impactoWeight} • urgência {urgenciaWeight} • complexidade{' '}
                        {complexidadeWeight}
                      </p>
                    </div>
                    <Badge variant={severityVariant}>Gravidade {severityLabel}</Badge>
                  </div>
                )}

                {/* Checklist */}
                <TriagemChecklist
                  demanda={demandaParaChecklist}
                  onChange={setChecklistValid}
                  onChecklistChange={setChecklistUpdates}
                  metadataContext={{
                    impactoOption,
                    urgenciaOption,
                    complexidadeOption,
                  }}
                />

                {/* Observações */}
                <div className="mt-6 space-y-2">
                  <Label htmlFor="observacoes" className="text-sm font-medium">
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione observações sobre a triagem..."
                    rows={4}
                    className="min-h-[100px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Informações adicionais sobre a análise e decisão de triagem
                  </p>
                </div>

                {/* Alertas */}
                {currentDemanda.triagem.possivelDuplicata && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium">Possível duplicata detectada</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarcarDuplicata(currentDemanda.id)}
                        className="ml-auto"
                      >
                        Marcar como duplicata (D)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Movimentações */}
                <div className="mb-6 mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">Movimentações</h3>
                    <Badge variant="outline" className="text-xs">
                      {currentDemanda.triagem.diasEmTriagem === 0
                        ? 'Hoje'
                        : currentDemanda.triagem.diasEmTriagem === 1
                          ? '1 dia'
                          : `${currentDemanda.triagem.diasEmTriagem} dias`}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[200px] rounded-lg border bg-secondary-50/50 p-4 dark:bg-secondary-900/10">
                    <div className="space-y-4">
                      {/* Criação da demanda */}
                      <div className="relative flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                          <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">Demanda criada</p>
                            <Badge variant="outline" className="text-xs">
                              {currentDemanda.triagem.diasEmTriagem === 0
                                ? 'Hoje'
                                : currentDemanda.triagem.diasEmTriagem === 1
                                  ? 'Há 1 dia'
                                  : `Há ${currentDemanda.triagem.diasEmTriagem} dias`}
                            </Badge>
                          </div>
                          {(currentDemanda.criadoPor || currentDemanda.responsavel) && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              Por{' '}
                              {currentDemanda.criadoPor?.nome || currentDemanda.responsavel?.nome}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="secondary" className="text-xs">
                              {currentDemanda.tipoLabel}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {currentDemanda.origemLabel}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Status atual */}
                      {currentDemanda.triagem.status && (
                        <div className="relative flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
                            <Clock className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">Status atual</p>
                              <Badge
                                variant={
                                  currentDemanda.triagem.status === 'PENDENTE_TRIAGEM'
                                    ? 'warning'
                                    : currentDemanda.triagem.status === 'PRONTO_DISCOVERY'
                                      ? 'success'
                                      : 'outline'
                                }
                                className="text-xs"
                              >
                                {currentDemanda.triagem.statusLabel}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {currentDemanda.triagem.status === 'PENDENTE_TRIAGEM'
                                ? 'Aguardando análise inicial'
                                : currentDemanda.triagem.status === 'AGUARDANDO_INFO'
                                  ? 'Aguardando informações complementares'
                                  : currentDemanda.triagem.status === 'PRONTO_DISCOVERY'
                                    ? 'Pronto para iniciar Discovery'
                                    : 'Status da triagem'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Avaliações realizadas */}
                      {(currentDemanda.triagem.impacto ||
                        currentDemanda.triagem.urgencia ||
                        currentDemanda.triagem.complexidade ||
                        impacto ||
                        urgencia ||
                        complexidade) && (
                        <div className="relative flex items-start gap-3">
                          <div className="bg-success-100 dark:bg-success-900/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                            <CheckCircle2 className="text-success-600 dark:text-success-400 h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold">Avaliações realizadas</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(impactoOption || currentDemanda.triagem.impacto) && (
                                <Badge
                                  variant={
                                    impactoOption ? resolveBadgeVariant(impactoOption) : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  Impacto:{' '}
                                  {impactoOption
                                    ? impactoOption.label
                                    : currentDemanda.triagem.impacto}
                                </Badge>
                              )}
                              {(urgenciaOption || currentDemanda.triagem.urgencia) && (
                                <Badge
                                  variant={
                                    urgenciaOption ? resolveBadgeVariant(urgenciaOption) : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  Urgência:{' '}
                                  {urgenciaOption
                                    ? urgenciaOption.label
                                    : currentDemanda.triagem.urgencia}
                                </Badge>
                              )}
                              {(complexidadeOption || currentDemanda.triagem.complexidade) && (
                                <Badge
                                  variant={
                                    complexidadeOption
                                      ? resolveBadgeVariant(complexidadeOption)
                                      : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  Complexidade:{' '}
                                  {complexidadeOption
                                    ? complexidadeOption.label
                                    : currentDemanda.triagem.complexidade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Revisões */}
                      {currentDemanda.triagem.revisoesTriagem > 0 && (
                        <div className="relative flex items-start gap-3">
                          <div className="bg-warning-100 dark:bg-warning-900/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                            <RotateCcw className="text-warning-600 dark:text-warning-400 h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">
                                {currentDemanda.triagem.revisoesTriagem}{' '}
                                {currentDemanda.triagem.revisoesTriagem === 1
                                  ? 'revisão realizada'
                                  : 'revisões realizadas'}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Demanda retomada após solicitação de informações
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Possível duplicata */}
                      {currentDemanda.triagem.possivelDuplicata && (
                        <div className="relative flex items-start gap-3">
                          <div className="bg-error-100 dark:bg-error-900/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                            <AlertCircle className="text-error-600 dark:text-error-400 h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold">Possível duplicata detectada</p>
                            <p className="text-xs text-muted-foreground">
                              Sistema identificou demandas similares que podem ser duplicatas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar de ações */}
          <div className="w-80 border-l bg-gray-50 p-6 dark:bg-gray-900/50">
            <h3 className="mb-4 font-semibold">Ações Rápidas</h3>

            <div className="space-y-3">
              <Button
                variant="gradient"
                className="w-full justify-between"
                disabled={!canSubmit}
                onClick={handleTriar}
              >
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Discovery
                </span>
                <kbd className="text-xs">E</kbd>
              </Button>

              {onSalvar && (
                <Button
                  variant="secondary"
                  className="w-full justify-between"
                  disabled={isSaving || (!impacto && !urgencia && !complexidade)}
                  onClick={handleSalvar}
                >
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Triagem'}
                  </span>
                  <kbd className="text-xs">Ctrl+S</kbd>
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => onSolicitarInfo(currentDemanda.id)}
              >
                <span className="flex items-center">
                  <Info className="mr-2 h-4 w-4" />
                  Solicitar Info
                </span>
                <kbd className="text-xs">S</kbd>
              </Button>

              {shouldSuggestEpico && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => onVirarEpico(currentDemanda.id)}
                >
                  <span className="flex items-center">
                    <Rocket className="mr-2 h-4 w-4" />
                    Virar Épico
                  </span>
                  <span className="text-xs text-muted-foreground">Shift + E</span>
                </Button>
              )}
              {shouldSuggestEpico && epicHint && (
                <p className="text-xs text-muted-foreground">{epicHint}</p>
              )}

              <Button
                variant="outline"
                className="text-destructive w-full justify-between"
                onClick={() => {
                  onArquivar(currentDemanda.id)
                  handleNext()
                }}
              >
                <span className="flex items-center">
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </span>
                <kbd className="text-xs">A</kbd>
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior (K)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === demandas.length - 1}
              >
                Próxima (J)
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Help overlay */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 text-lg font-semibold">Atalhos de Teclado</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Próxima demanda</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                      J / →
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Demanda anterior</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                      K / ←
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Enviar para Discovery</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">E</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Salvar Triagem</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                      Ctrl+S
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Focar em Impacto</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">I</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Focar em Urgência</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">U</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Focar em Complexidade</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Solicitar informações</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Marcar como duplicata</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">D</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Arquivar</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Mostrar/Esconder ajuda</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                      ? / H
                    </kbd>
                  </div>
                  <div className="col-span-2 mt-4 text-muted-foreground">
                    Use números 1-4 para selecionar níveis quando um campo estiver focado
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
