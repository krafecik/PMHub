'use client'

import * as React from 'react'
import {
  Send,
  Info,
  Archive,
  Copy,
  Rocket,
  RotateCcw,
  FileText,
  User,
  Calendar,
  Package2,
  Lightbulb,
  Bug,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { TriagemChecklist } from './TriagemChecklist'
import { cn } from '@/lib/utils'
import type { DemandaTriagem, DemandaPendenteTriagem, TriarDemandaPayload } from '@/lib/triagem-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTriagemCatalogOptions } from '@/hooks/use-triagem-catalogos'
import {
  obterSinaisTriagem,
  type TriagemSinal,
  obterSugestoesTriagem,
  type TriagemSugestao,
  obterHistoricoSolucoes,
  type HistoricoSolucao,
  gerarSugestaoEncaminhamentoIa,
  type SugestaoEncaminhamentoIa,
  evoluirParaDiscovery,
} from '@/lib/triagem-api'
import { SinaisPainel } from './sinais-painel'
import { SugestoesPainel } from './sugestoes-painel'
import { HistoricoSolucoes } from './historico-solucoes'

interface ModalDetalheTriagemProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demanda: DemandaPendenteTriagem | null
  onTriar?: (
    demandaId: string,
    payload: TriarDemandaPayload,
  ) => Promise<{ discoveryId?: string } | void>
  onSolicitarInfo?: () => void
  onMarcarDuplicata?: () => void
  onArquivar?: () => void
  onVirarEpico?: () => void
}

const tipoIcons = {
  IDEIA: Lightbulb,
  PROBLEMA: Bug,
  OPORTUNIDADE: Rocket,
  OUTRO: Package2,
} as const

// Função para verificar se o conteúdo HTML está vazio
const isHtmlEmpty = (html: string): boolean => {
  if (!html) return true
  // Remove tags HTML e espaços
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  const text = tmp.textContent || tmp.innerText || ''
  return text.trim().length === 0
}

export function ModalDetalheTriagem({
  open,
  onOpenChange,
  demanda: demandaOriginal,
  onTriar,
  onSolicitarInfo,
  onMarcarDuplicata,
  onArquivar,
  onVirarEpico,
}: ModalDetalheTriagemProps) {
  const [checklistValid, setChecklistValid] = React.useState(false)
  const [impacto, setImpacto] = React.useState(demandaOriginal?.triagem?.impacto || '')
  const [urgencia, setUrgencia] = React.useState(demandaOriginal?.triagem?.urgencia || '')
  const [complexidade, setComplexidade] = React.useState(
    demandaOriginal?.triagem?.complexidade || '',
  )
  const [observacoes, setObservacoes] = React.useState('')
  const [encaminhamentoIa, setEncaminhamentoIa] = React.useState<SugestaoEncaminhamentoIa | null>(
    null,
  )

  const demandaId = demandaOriginal?.id
  const queryClient = useQueryClient()

  const { data: sinaisResponse, isLoading: sinaisLoading } = useQuery({
    queryKey: ['triagem', 'sinais', demandaId],
    queryFn: () => obterSinaisTriagem(demandaId!),
    enabled: open && Boolean(demandaId),
    staleTime: 1000 * 30,
  })

  const { data: sugestoesResponse, isLoading: sugestoesLoading } = useQuery({
    queryKey: ['triagem', 'sugestoes', demandaId],
    queryFn: () => obterSugestoesTriagem(demandaId!),
    enabled: open && Boolean(demandaId),
    staleTime: 1000 * 45,
  })

  const { data: historicoResponse, isLoading: historicoLoading } = useQuery({
    queryKey: ['triagem', 'historico', demandaId],
    queryFn: () => obterHistoricoSolucoes(demandaId!),
    enabled: open && Boolean(demandaId),
    staleTime: 1000 * 60,
  })

  const triagemCatalogs = useTriagemCatalogOptions()

  const impactoCatalog = triagemCatalogs.impacto
  const urgenciaCatalog = triagemCatalogs.urgencia
  const complexidadeCatalog = triagemCatalogs.complexidade

  const impactoOptions = impactoCatalog.options
  const urgenciaOptions = urgenciaCatalog.options
  const complexidadeOptions = complexidadeCatalog.options

  const impactoMap = impactoCatalog.map
  const urgenciaMap = urgenciaCatalog.map
  const complexidadeMap = complexidadeCatalog.map

  const normalizeValue = (value?: string | null) => (value ? value.toString().toUpperCase() : '')

  const impactoOptionSelecionada = impactoMap.get(normalizeValue(impacto))
  const urgenciaOptionSelecionada = urgenciaMap.get(normalizeValue(urgencia))
  const complexidadeOptionSelecionada = complexidadeMap.get(normalizeValue(complexidade))

  // Resetar valores quando mudar a demanda
  React.useEffect(() => {
    if (demandaOriginal) {
      setImpacto(demandaOriginal.triagem?.impacto || '')
      setUrgencia(demandaOriginal.triagem?.urgencia || '')
      setComplexidade(demandaOriginal.triagem?.complexidade || '')
      setObservacoes('')
      setEncaminhamentoIa(null)
    }
  }, [demandaOriginal])

  React.useEffect(() => {
    if (impactoOptions.length === 0) return
    const normalized = normalizeValue(impacto)
    if (!normalized || !impactoMap.has(normalized)) {
      setImpacto(impactoOptions[0].value)
    }
  }, [impactoOptions, impactoMap, impacto])

  React.useEffect(() => {
    if (urgenciaOptions.length === 0) return
    const normalized = normalizeValue(urgencia)
    if (!normalized || !urgenciaMap.has(normalized)) {
      setUrgencia(urgenciaOptions[0].value)
    }
  }, [urgenciaOptions, urgenciaMap, urgencia])

  React.useEffect(() => {
    if (complexidadeOptions.length === 0) return
    const normalized = normalizeValue(complexidade)
    if (!normalized || !complexidadeMap.has(normalized)) {
      setComplexidade(complexidadeOptions[0].value)
    }
  }, [complexidadeOptions, complexidadeMap, complexidade])

  // Converter DemandaPendenteTriagem para DemandaTriagem para o checklist
  const demandaParaChecklist: DemandaTriagem | null = demandaOriginal
    ? {
        id: demandaOriginal.id,
        titulo: demandaOriginal.titulo,
        descricao: demandaOriginal.descricao,
        tipo: demandaOriginal.tipo,
        origem: demandaOriginal.origem,
        produtoId: demandaOriginal.produto?.id || null,
        triagem: {
          id: demandaOriginal.triagem.id,
          status: demandaOriginal.triagem.status,
          impacto,
          urgencia,
          complexidade,
          duplicatasRevisadas: demandaOriginal.triagem.possivelDuplicata === false,
        },
        duplicatasSugeridas: demandaOriginal.triagem.possivelDuplicata
          ? [
              // Mock - em produção viriam da API
              { id: '12', titulo: 'Demanda similar #12', similaridade: 0.87 },
              { id: '07', titulo: 'Demanda similar #07', similaridade: 0.75 },
            ]
          : [],
        anexos: [], // TODO: buscar anexos da API quando implementado
      }
    : null

  // Mutation combinada: salvar triagem e depois evoluir
  const triarMutation = useMutation({
    mutationFn: async () => {
      if (!demandaOriginal) return

      // Primeiro salva a triagem (se onTriar estiver disponível)
      if (onTriar) {
        const payload: TriarDemandaPayload = {
          novoStatus: 'PRONTO_DISCOVERY',
          impacto: impacto || undefined,
          urgencia: urgencia || undefined,
          complexidade: complexidade || undefined,
          observacoes: observacoes && !isHtmlEmpty(observacoes) ? observacoes : undefined,
        }
        await onTriar(demandaOriginal.id, payload)
      }

      // Aguardar um pouco para garantir que a triagem foi salva
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Depois evolui para Discovery
      return evoluirParaDiscovery(demandaOriginal.id)
    },
    onSuccess: async (data) => {
      // Invalidar queries para atualizar a lista
      await queryClient.invalidateQueries({ queryKey: ['triagem'] })
      await queryClient.invalidateQueries({ queryKey: ['demandas'] })

      toast.success('Demanda enviada para Discovery', {
        description: data?.discoveryId ? `ID Discovery: ${data.discoveryId}` : undefined,
      })

      // Fechar modal após um pequeno delay para garantir que o toast apareça
      setTimeout(() => {
        onOpenChange(false)
      }, 100)
    },
    onError: (error: any) => {
      console.error('Erro ao enviar para Discovery:', error)
      const errorData = error?.response?.data || error?.data
      const errorMessage =
        errorData?.message || error?.message || 'Erro ao enviar demanda para Discovery'
      const errorDetails = errorData?.details

      if (errorDetails && Array.isArray(errorDetails)) {
        const issues = errorDetails.map((d: any) => `• ${d.issue || d.message || ''}`).join('\n')
        toast.error('Triagem incompleta', {
          description: issues || errorMessage,
          duration: 5000,
        })
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const gerarEncaminhamentoMutation = useMutation({
    mutationFn: async () => {
      if (!demandaId) return null
      return gerarSugestaoEncaminhamentoIa(demandaId)
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

  // Estado do Checklist levantado para o modal para persistir entre abas
  // IMPORTANTE: Todos os hooks devem ser declarados ANTES de qualquer early return
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set())

  // Resetar checklist e observações quando o modal fechar
  React.useEffect(() => {
    if (!open) {
      setCheckedItems(new Set())
      setObservacoes('')
    }
  }, [open])

  const handleChecklistChange = React.useCallback(
    (updates: Array<{ itemId: string; completed: boolean }>) => {
      setCheckedItems((prev) => {
        const next = new Set(prev)
        updates.forEach((u) => {
          if (u.completed) next.add(u.itemId)
          else next.delete(u.itemId)
        })
        return next
      })
    },
    [],
  )

  if (!demandaOriginal || !demandaParaChecklist) return null

  // Verificar se a demanda já está em discovery (após garantir que demandaOriginal existe)
  const jaEstaEmDiscovery = demandaOriginal.triagem.status === 'PRONTO_DISCOVERY'

  const podeEnviarDiscovery =
    !jaEstaEmDiscovery && checklistValid && impacto && urgencia && complexidade

  const Icon = tipoIcons[demandaOriginal.tipo as keyof typeof tipoIcons] || Package2
  const demandaImpactoNormalized = normalizeValue(demandaOriginal.triagem.impacto)
  const impactoOptionForDemanda = triagemCatalogs.impacto.map.get(demandaImpactoNormalized)
  const complexidadeStateNormalized = normalizeValue(complexidade)
  const sinais: TriagemSinal[] = sinaisResponse?.sinais ?? []
  const sugestoes: TriagemSugestao[] = sugestoesResponse?.sugestoes ?? []
  const historico: HistoricoSolucao[] = historicoResponse?.historico ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  demandaOriginal.tipo === 'IDEIA' && 'bg-amber-100 text-amber-700',
                  demandaOriginal.tipo === 'PROBLEMA' && 'bg-red-100 text-red-700',
                  demandaOriginal.tipo === 'OPORTUNIDADE' && 'bg-blue-100 text-blue-700',
                  demandaOriginal.tipo === 'OUTRO' && 'bg-gray-100 text-gray-700',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">#{demandaOriginal.id} - Triagem</DialogTitle>
                <DialogDescription asChild>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{demandaOriginal.tipoLabel}</span>
                    <span>|</span>
                    <span>{demandaOriginal.produto.nome}</span>
                    <span>|</span>
                    <span>{demandaOriginal.origemLabel}</span>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs.Root defaultValue="informacoes" className="flex min-h-0 flex-1 flex-col">
          <Tabs.List className="flex-shrink-0 border-b px-6 pt-4">
            <Tabs.Trigger
              value="informacoes"
              className="hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-b-2"
            >
              Informações
            </Tabs.Trigger>
            <Tabs.Trigger
              value="checklist"
              className="hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-b-2"
            >
              Checklist
            </Tabs.Trigger>
            <Tabs.Trigger
              value="avaliacoes"
              className="hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-b-2"
            >
              Avaliações
            </Tabs.Trigger>
            {demandaParaChecklist.anexos && demandaParaChecklist.anexos.length > 0 && (
              <Tabs.Trigger
                value="anexos"
                className="hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-b-2"
              >
                Anexos
              </Tabs.Trigger>
            )}
          </Tabs.List>

          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                <Tabs.Content value="informacoes" className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Painel de sinais
                    </h3>
                    <SinaisPainel sinais={sinais} loading={sinaisLoading} />
                  </div>

                  <div className="rounded-lg border border-primary-200/60 bg-primary-50/60 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
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

                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Sugestões do sistema
                    </h3>
                    <SugestoesPainel sugestoes={sugestoes} loading={sugestoesLoading} />
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Histórico de soluções parecidas
                    </h3>
                    <HistoricoSolucoes historico={historico} loading={historicoLoading} />
                  </div>

                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{demandaOriginal.titulo}</h3>
                    {demandaOriginal.descricao && (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&_h1]:my-4 [&_h2]:my-3 [&_h3]:my-2 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:my-2 [&_p]:my-2 [&_ul]:my-2"
                        dangerouslySetInnerHTML={{ __html: demandaOriginal.descricao }}
                      />
                    )}

                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Criado por:{' '}
                        {demandaOriginal.criadoPor?.nome ||
                          demandaOriginal.responsavel?.nome ||
                          'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Criado há {demandaOriginal.triagem.diasEmTriagem} dias
                      </div>
                      {demandaOriginal.triagem.revisoesTriagem > 0 && (
                        <div className="flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" />
                          {demandaOriginal.triagem.revisoesTriagem} revisões
                        </div>
                      )}
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="checklist" className="space-y-4">
                  <TriagemChecklist
                    demanda={demandaParaChecklist}
                    onChange={setChecklistValid}
                    onChecklistChange={handleChecklistChange}
                    initialChecked={checkedItems}
                    metadataContext={{
                      impactoOption: impactoOptionSelecionada,
                      urgenciaOption: urgenciaOptionSelecionada,
                      complexidadeOption: complexidadeOptionSelecionada,
                    }}
                  />
                </Tabs.Content>

                <Tabs.Content value="avaliacoes" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">📊 Avaliações</h3>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Impacto <span className="text-destructive">*</span>
                        </label>
                        <Select value={impacto} onValueChange={setImpacto}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o impacto" />
                          </SelectTrigger>
                          <SelectContent>
                            {impactoOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Urgência <span className="text-destructive">*</span>
                        </label>
                        <Select value={urgencia} onValueChange={setUrgencia}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            {urgenciaOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Complexidade <span className="text-destructive">*</span>
                        </label>
                        <Select value={complexidade} onValueChange={setComplexidade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a complexidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {complexidadeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observações</label>
                      <RichTextEditor
                        content={observacoes}
                        onChange={(content) => setObservacoes(content)}
                        placeholder="Adicione observações sobre a triagem..."
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                </Tabs.Content>

                {demandaParaChecklist.anexos && demandaParaChecklist.anexos.length > 0 && (
                  <Tabs.Content value="anexos" className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">📎 Anexos</h3>
                      <div className="space-y-2">
                        {demandaParaChecklist.anexos.map((anexo) => (
                          <div key={anexo.id} className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={anexo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-sm hover:underline"
                            >
                              {anexo.nome}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Tabs.Content>
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs.Root>

        {/* Footer com ações */}
        <div className="flex-shrink-0 border-t bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onSolicitarInfo}>
                <Info className="mr-2 h-4 w-4" />
                Solicitar Info
              </Button>

              {demandaOriginal.triagem.possivelDuplicata && (
                <Button variant="outline" size="sm" onClick={onMarcarDuplicata}>
                  <Copy className="mr-2 h-4 w-4" />
                  Marcar Duplicada
                </Button>
              )}

              {(impactoOptionForDemanda?.value === 'ALTO' ||
                impactoOptionForDemanda?.value === 'CRITICO' ||
                complexidadeStateNormalized === 'ALTA') && (
                <Button variant="outline" size="sm" onClick={onVirarEpico}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Virar Épico
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={onArquivar}>
                <Archive className="mr-2 h-4 w-4" />
                Arquivar
              </Button>

              <Button
                variant="gradient"
                size="sm"
                onClick={() => triarMutation.mutate()}
                disabled={!podeEnviarDiscovery || triarMutation.isPending || jaEstaEmDiscovery}
                title={jaEstaEmDiscovery ? 'Esta demanda já foi enviada para Discovery' : undefined}
              >
                <Send className="mr-2 h-4 w-4" />
                {triarMutation.isPending
                  ? 'Enviando...'
                  : jaEstaEmDiscovery
                    ? 'Já em Discovery'
                    : 'Enviar para Discovery'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
