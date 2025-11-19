'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Bug,
  Rocket,
  Package2,
  Clock,
  CheckCircle,
  Archive,
  Copy,
  MoreHorizontal,
  User,
  Calendar,
  Info,
  Send,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import {
  DemandaPendenteTriagem,
  obterSugestoesTriagem,
  type TriagemSugestao,
} from '@/lib/triagem-api'
import { useTriagemCatalogOptions, TriagemOption } from '@/hooks/use-triagem-catalogos'
import { useQuery } from '@tanstack/react-query'
import { SugestoesPainel } from './sugestoes-painel'

interface DemandaTriagemCardProps {
  demanda: DemandaPendenteTriagem
  onTriar?: () => void
  onSolicitarInfo?: () => void
  onMarcarDuplicata?: () => void
  onArquivar?: () => void
  onVirarEpico?: () => void
  onReatribuir?: () => void
  index?: number
  expandido?: boolean
}

const tipoIcons = {
  IDEIA: Lightbulb,
  PROBLEMA: Bug,
  OPORTUNIDADE: Rocket,
  OUTRO: Package2,
} as const

const statusColors = {
  PENDENTE_TRIAGEM: 'warning',
  AGUARDANDO_INFO: 'secondary',
  RETOMADO_TRIAGEM: 'accent',
} as const

const fallbackImpactoVariants: Record<string, string> = {
  BAIXO: 'outline',
  MEDIO: 'secondary',
  ALTO: 'warning',
  CRITICO: 'destructive',
}

const fallbackUrgenciaVariants: Record<string, string> = {
  BAIXA: 'outline',
  MEDIA: 'secondary',
  ALTA: 'destructive',
}

export function DemandaTriagemCard({
  demanda,
  onTriar,
  onSolicitarInfo,
  onMarcarDuplicata,
  onArquivar,
  onVirarEpico,
  onReatribuir,
  index = 0,
  expandido: expandidoInicial = false,
}: DemandaTriagemCardProps) {
  const [expandido, setExpandido] = React.useState(expandidoInicial)
  const Icon = tipoIcons[demanda.tipo as keyof typeof tipoIcons] || Package2
  const triagemCatalogs = useTriagemCatalogOptions()
  const normalizeValue = (value?: string | null) => (value ? value.toString().toUpperCase() : '')

  const { data: sugestoesResponse, isLoading: sugestoesLoading } = useQuery({
    queryKey: ['triagem', 'sugestoes', demanda.id],
    queryFn: () => obterSugestoesTriagem(demanda.id),
    enabled: expandido,
    staleTime: 1000 * 45,
  })

  const sugestoes: TriagemSugestao[] = sugestoesResponse?.sugestoes ?? []

  const getMetadataString = (option: TriagemOption | undefined, key: string) => {
    const metadata = option?.metadata as Record<string, unknown> | undefined
    const value = metadata?.[key]
    return typeof value === 'string' ? value : undefined
  }

  const impactoOption = triagemCatalogs.impacto.map.get(normalizeValue(demanda.triagem.impacto))
  const urgenciaOption = triagemCatalogs.urgencia.map.get(normalizeValue(demanda.triagem.urgencia))
  const complexidadeOption = triagemCatalogs.complexidade.map.get(
    normalizeValue(demanda.triagem.complexidade),
  )

  const impactoLabel = impactoOption?.label ?? demanda.triagem.impacto
  const urgenciaLabel = urgenciaOption?.label ?? demanda.triagem.urgencia
  const complexidadeLabel = complexidadeOption?.label ?? demanda.triagem.complexidade

  const impactoVariant = (getMetadataString(impactoOption, 'badgeVariant') ??
    fallbackImpactoVariants[normalizeValue(demanda.triagem.impacto)] ??
    'outline') as any

  const urgenciaVariant = (getMetadataString(urgenciaOption, 'badgeVariant') ??
    fallbackUrgenciaVariants[normalizeValue(demanda.triagem.urgencia)] ??
    'outline') as any

  const demandaImpactoNormalized = normalizeValue(demanda.triagem.impacto)
  const demandaComplexidadeNormalized = normalizeValue(demanda.triagem.complexidade)

  // Calcular sinais visuais
  const sinais = React.useMemo(() => {
    const resultado = []

    // Falta evidência
    if (!demanda.descricao || demanda.descricao.length < 50) {
      resultado.push({ tipo: 'erro', mensagem: 'Falta evidência' })
    }

    // Impreciso
    if (demanda.titulo.length < 10 || demanda.titulo.includes('?')) {
      resultado.push({ tipo: 'alerta', mensagem: 'Impreciso' })
    }

    // Útil
    if (demanda.triagem.impacto && demanda.triagem.urgencia) {
      resultado.push({ tipo: 'sucesso', mensagem: 'Útil' })
    }

    return resultado
  }, [demanda])

  // Calcular progresso do checklist
  const progressoChecklist = React.useMemo(() => {
    const itensObrigatorios = demanda.triagem.checklist.filter((item) => item.required)
    const itensConcluidos = itensObrigatorios.filter((item) => item.completed)
    return {
      total: itensObrigatorios.length,
      concluidos: itensConcluidos.length,
      percentual:
        itensObrigatorios.length > 0
          ? Math.round((itensConcluidos.length / itensObrigatorios.length) * 100)
          : 0,
    }
  }, [demanda.triagem.checklist])

  // Verificar se pode enviar para Discovery
  const podeEnviarDiscovery =
    progressoChecklist.percentual === 100 &&
    demanda.triagem.impacto &&
    demanda.triagem.urgencia &&
    demanda.triagem.complexidade

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card
        variant="elevated"
        className={cn(
          'transition-all duration-200',
          'hover:border-primary-200 hover:shadow-lg',
          expandido && 'ring-2 ring-primary-200',
        )}
      >
        <div className="p-3">
          {/* Header */}
          <div className="mb-2 flex items-start justify-between">
            <div className="flex flex-1 items-start gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  demanda.tipo === 'IDEIA' && 'bg-amber-100 text-amber-700',
                  demanda.tipo === 'PROBLEMA' && 'bg-red-100 text-red-700',
                  demanda.tipo === 'OPORTUNIDADE' && 'bg-blue-100 text-blue-700',
                  demanda.tipo === 'OUTRO' && 'bg-gray-100 text-gray-700',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-xs text-text-muted">#{demanda.id}</span>
                  <Badge
                    variant={
                      statusColors[demanda.triagem.status as keyof typeof statusColors] as any
                    }
                  >
                    {demanda.triagem.statusLabel}
                  </Badge>
                  {demanda.triagem.status === 'PRONTO_DISCOVERY' && (
                    <Badge variant="success">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      No Discovery
                    </Badge>
                  )}
                  {demanda.triagem.aguardandoInfo && (
                    <Badge variant="warning">
                      <Clock className="mr-1 h-3 w-3" />
                      {demanda.triagem.diasEmTriagem}d aguardando
                    </Badge>
                  )}
                </div>

                <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">
                  {demanda.titulo}
                </h3>

                <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                  <span>{demanda.produto.nome}</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {demanda.origem}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Criado há {demanda.triagem.diasEmTriagem} dias
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="animate-in fade-in-0 zoom-in-95 z-50 min-w-[200px] rounded-lg border bg-background p-1.5 shadow-lg"
                  sideOffset={5}
                >
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary-100"
                    onSelect={onReatribuir}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reatribuir PM
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    className="text-error-DEFAULT flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary-100"
                    onSelect={onArquivar}
                  >
                    <Archive className="h-4 w-4" />
                    Arquivar
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Resumo */}
          {demanda.descricao && (
            <p className="mb-2 line-clamp-2 text-xs text-text-secondary">{demanda.descricao}</p>
          )}

          {/* Painel de Sinais */}
          <div className="mb-2 flex items-center gap-2">
            {sinais.map((sinal, idx) => (
              <Badge
                key={idx}
                variant={
                  sinal.tipo === 'erro'
                    ? 'destructive'
                    : sinal.tipo === 'alerta'
                      ? 'warning'
                      : ('success' as any)
                }
                className="text-xs"
              >
                {sinal.tipo === 'erro' && <XCircle className="mr-1 h-3 w-3" />}
                {sinal.tipo === 'alerta' && <AlertTriangle className="mr-1 h-3 w-3" />}
                {sinal.tipo === 'sucesso' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {sinal.mensagem}
              </Badge>
            ))}
          </div>

          {/* Avaliações */}
          <div className="mb-2 flex items-center gap-2">
            {demanda.triagem.impacto && (
              <Badge variant={impactoVariant}>Impacto: {impactoLabel}</Badge>
            )}
            {demanda.triagem.urgencia && (
              <Badge variant={urgenciaVariant}>Urgência: {urgenciaLabel}</Badge>
            )}
            {demanda.triagem.complexidade && (
              <Badge variant="outline">Complexidade: {complexidadeLabel}</Badge>
            )}
          </div>

          {/* Progress do Checklist */}
          <div className="mb-2">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-xs text-text-muted">Checklist de Triagem</span>
              <span className="text-xs font-medium text-text-primary">
                {progressoChecklist.concluidos}/{progressoChecklist.total}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary-200">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  progressoChecklist.percentual === 100
                    ? 'bg-success-DEFAULT'
                    : progressoChecklist.percentual >= 50
                      ? 'bg-warning-DEFAULT'
                      : 'bg-error-DEFAULT',
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressoChecklist.percentual}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Sugestões do Sistema (quando expandido) */}
          {expandido && (
            <>
              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text-primary">Sugestões do Sistema</h4>
                  {sugestoesLoading && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Carregando...
                    </Badge>
                  )}
                </div>
                <SugestoesPainel sugestoes={sugestoes} loading={sugestoesLoading} />
              </div>

              {/* Checklist detalhado */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-text-primary">Checklist Detalhado</h4>
                {demanda.triagem.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    {item.completed ? (
                      <CheckCircle className="text-success-DEFAULT h-4 w-4" />
                    ) : (
                      <div
                        className={cn(
                          'h-4 w-4 rounded-full border-2',
                          item.required ? 'border-error-DEFAULT' : 'border-secondary-300',
                        )}
                      />
                    )}
                    <span className={cn(item.completed && 'text-text-muted line-through')}>
                      {item.label}
                      {item.required && ' *'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Ações */}
          <div className="mt-2 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setExpandido(!expandido)}>
              {expandido ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Expandir
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onSolicitarInfo}>
                <Info className="mr-2 h-4 w-4" />
                Solicitar Info
              </Button>

              {demanda.triagem.possivelDuplicata && (
                <Button variant="outline" size="sm" onClick={onMarcarDuplicata}>
                  <Copy className="mr-2 h-4 w-4" />
                  Marcar Duplicada
                </Button>
              )}

              {demandaImpactoNormalized === 'ALTO' ||
              demandaImpactoNormalized === 'CRITICO' ||
              demandaComplexidadeNormalized === 'ALTA' ? (
                <Button variant="outline" size="sm" onClick={onVirarEpico}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Virar Épico
                </Button>
              ) : null}

              <Button
                variant="gradient"
                size="sm"
                onClick={onTriar}
                disabled={!podeEnviarDiscovery}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar para Discovery
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
