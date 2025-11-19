'use client'

import * as React from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { DemandaTriagem } from '@/lib/triagem-api'
import { getMetadataNumber, getMetadataString, TriagemOption } from '@/hooks/use-triagem-catalogos'

interface ChecklistItem {
  id: string
  label: string
  description: string
  validate: (demanda: DemandaTriagem) => boolean
  required: boolean
}

interface TriagemChecklistProps {
  demanda: DemandaTriagem
  onChange?: (allRequiredValid: boolean) => void
  onChecklistChange?: (checklistUpdates: Array<{ itemId: string; completed: boolean }>) => void
  initialChecked?: Set<string>
  metadataContext?: {
    impactoOption?: TriagemOption
    urgenciaOption?: TriagemOption
    complexidadeOption?: TriagemOption
  }
}

export function TriagemChecklist({
  demanda,
  onChange,
  onChecklistChange,
  initialChecked,
  metadataContext,
}: TriagemChecklistProps) {
  const impactoOption = metadataContext?.impactoOption
  const urgenciaOption = metadataContext?.urgenciaOption
  const complexidadeOption = metadataContext?.complexidadeOption

  // Estado para controlar quais itens foram marcados manualmente pelo usuário
  // Se initialChecked for fornecido, usa ele como estado inicial
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(() => 
    initialChecked ? new Set(initialChecked) : new Set()
  )

  // Ref para rastrear o último initialChecked recebido e evitar sincronizações desnecessárias
  const lastInitialCheckedRef = React.useRef<string>('')

  // Sincroniza se initialChecked mudar externamente (preserva estado ao trocar de aba)
  React.useEffect(() => {
    if (initialChecked !== undefined) {
      const newArray = Array.from(initialChecked).sort()
      const newKey = JSON.stringify(newArray)
      
      // Só atualiza se o initialChecked realmente mudou
      if (lastInitialCheckedRef.current !== newKey) {
        lastInitialCheckedRef.current = newKey
        setCheckedItems(new Set(initialChecked))
      }
    }
  }, [initialChecked])

  const parseBoolean = React.useCallback((option: TriagemOption | undefined, key: string) => {
    const raw = option?.metadata as Record<string, unknown> | undefined
    const value = raw?.[key]
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      return ['true', '1', 'yes', 'sim'].includes(normalized)
    }
    if (typeof value === 'number') return value > 0
    return false
  }, [])

  const minWordsThreshold = React.useMemo(() => {
    const candidates = [impactoOption, complexidadeOption]
      .map((option) => getMetadataNumber(option, 'descriptionMinWords'))
      .filter((value): value is number => typeof value === 'number' && value > 0)
    return candidates.length > 0 ? Math.max(...candidates) : 10
  }, [impactoOption, complexidadeOption])

  const minCharsThreshold = React.useMemo(() => {
    const candidates = [impactoOption, complexidadeOption]
      .map((option) => getMetadataNumber(option, 'descriptionMinChars'))
      .filter((value): value is number => typeof value === 'number' && value > 0)
    return candidates.length > 0 ? Math.max(...candidates) : 120
  }, [impactoOption, complexidadeOption])

  const requireEvidence = React.useMemo(
    () =>
      parseBoolean(impactoOption, 'requireEvidence') ||
      parseBoolean(complexidadeOption, 'requireEvidence'),
    [impactoOption, complexidadeOption, parseBoolean],
  )

  const requireMetrics = React.useMemo(
    () =>
      parseBoolean(impactoOption, 'requireMetrics') ||
      parseBoolean(urgenciaOption, 'requireMetrics'),
    [impactoOption, urgenciaOption, parseBoolean],
  )

  const requireStakeholder = React.useMemo(
    () =>
      parseBoolean(impactoOption, 'requireStakeholder') ||
      parseBoolean(urgenciaOption, 'requireStakeholder'),
    [impactoOption, urgenciaOption, parseBoolean],
  )

  const additionalChecklistItems = React.useMemo(() => {
    const options = [impactoOption, urgenciaOption, complexidadeOption]
    const rawItems = options.flatMap((option) => {
      const metadata = option?.metadata as Record<string, unknown> | undefined
      const entries = metadata?.checklist
      return Array.isArray(entries) ? entries : []
    }) as Array<{
      id?: string
      label?: string
      description?: string
      required?: boolean
      validator?: string
    }>

    const knownValidators: Record<string, (demanda: DemandaTriagem) => boolean> = {
      evidence: (demanda) => (demanda.anexos?.length ?? 0) > 0,
      metrics: (demanda) => /%|\b(kpi|indicador|taxa)\b/i.test(demanda.descricao ?? ''),
      persona: (demanda) => /persona|perfil|segmento/i.test(demanda.descricao ?? ''),
    }

    return rawItems
      .filter((item) => item.label)
      .map<ChecklistItem>((item, index) => {
        const validatorKey = item.validator?.toLowerCase() ?? ''
        const validator = knownValidators[validatorKey] ?? (() => true)
        const id = item.id ?? `metadata_${index}`
        return {
          id,
          label: item.label ?? `Checklist extra ${index + 1}`,
          description:
            item.description ??
            getMetadataString(impactoOption, 'checklistHint') ??
            'Requisito adicional configurado para este catálogo.',
          validate: validator,
          required: item.required ?? false,
        }
      })
  }, [impactoOption, urgenciaOption, complexidadeOption])

  const checklistItems = React.useMemo(() => {
    const items: ChecklistItem[] = [
      {
        id: 'descricao_clara',
        label: 'Descrição clara e objetiva',
        description: `A demanda possui descrição com pelo menos ${minWordsThreshold} palavras e ${minCharsThreshold} caracteres`,
        validate: (demanda) => {
          const descricao = demanda.descricao || ''
          const wordCount = descricao.trim().split(/\s+/).filter(Boolean).length
          return descricao.length >= minCharsThreshold && wordCount >= minWordsThreshold
        },
        required: true,
      },
      {
        id: 'produto_correto',
        label: 'Alinhada ao produto correto',
        description: 'A demanda está associada ao produto responsável',
        validate: (demanda) => demanda.produtoId !== null,
        required: true,
      },
      {
        id: 'impacto_definido',
        label: 'Impacto avaliado',
        description: 'O impacto da demanda foi definido conforme catálogo',
        validate: (demanda) => Boolean(demanda.triagem?.impacto),
        required: true,
      },
      {
        id: 'urgencia_definida',
        label: 'Urgência avaliada',
        description: 'A urgência foi registrada e validada com o time',
        validate: (demanda) => Boolean(demanda.triagem?.urgencia),
        required: true,
      },
      {
        id: 'sem_duplicacao',
        label: 'Duplicações revisadas',
        description: 'Não existem duplicações ou já foram avaliadas',
        validate: (demanda) =>
          demanda.duplicatasSugeridas && demanda.duplicatasSugeridas.length > 0
            ? demanda.triagem?.duplicatasRevisadas === true
            : true,
        required: true,
      },
    ]

    if (requireEvidence) {
      items.push({
        id: 'evidencias_configuradas',
        label: getMetadataString(impactoOption, 'evidenceLabel') ?? 'Evidências anexadas',
        description:
          getMetadataString(impactoOption, 'evidenceDescription') ??
          'Demandas deste nível exigem anexar evidências, prints ou dados que comprovem o impacto.',
        validate: (demanda) => (demanda.anexos?.length ?? 0) > 0,
        required: true,
      })
    }

    if (requireMetrics) {
      items.push({
        id: 'metricas_definidas',
        label: 'Métricas ou indicadores informados',
        description:
          'Inclua no corpo da demanda os indicadores afetados (ex.: conversão, NPS, tempo médio).',
        validate: (demanda) => /%|kpi|indicador|nps|taxa|tempo/i.test(demanda.descricao ?? ''),
        required: false,
      })
    }

    if (requireStakeholder) {
      items.push({
        id: 'stakeholder_identificado',
        label: 'Stakeholder identificado',
        description: 'Informe quem reportou o problema ou qual segmento será afetado.',
        validate: (demanda) =>
          /cliente|stakeholder|segmento|persona/i.test(demanda.descricao ?? ''),
        required: false,
      })
    }

    const existingIds = new Set(items.map((item) => item.id))
    additionalChecklistItems.forEach((item) => {
      if (!existingIds.has(item.id)) {
        items.push(item)
      }
    })

    return items
  }, [
    minWordsThreshold,
    minCharsThreshold,
    requireEvidence,
    requireMetrics,
    requireStakeholder,
    impactoOption,
    additionalChecklistItems,
  ])

  // Função para alternar o estado de um item do checklist
  const toggleItem = React.useCallback((itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const checklistResults = checklistItems.map((item) => ({
    ...item,
    isValid: item.validate(demanda),
    checked: checkedItems.has(item.id), // Estado manual do checkbox
  }))

  // Um item obrigatório é válido apenas se foi marcado manualmente
  const requiredItemsValid = checklistResults
    .filter((item) => item.required)
    .every((item) => item.checked)

  const totalItems = checklistItems.length
  const checkedItemsCount = checklistResults.filter((item) => item.checked).length
  const progress = (checkedItemsCount / totalItems) * 100

  React.useEffect(() => {
    onChange?.(requiredItemsValid)
  }, [onChange, requiredItemsValid])

  React.useEffect(() => {
    if (onChecklistChange) {
      const updates = checklistItems.map((item) => ({
        itemId: item.id,
        completed: checkedItems.has(item.id),
      }))
      onChecklistChange(updates)
    }
  }, [checkedItems, checklistItems, onChecklistChange])

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              🔎 Checklist de Triagem
              {requiredItemsValid ? (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Pronto para Discovery
                </span>
              ) : (
                <span className="text-sm text-amber-600 dark:text-amber-400">Pendências</span>
              )}
            </h3>
            <span className="text-sm text-muted-foreground">
              {checkedItemsCount}/{totalItems} completos
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                progress === 100 ? 'bg-green-600' : 'bg-blue-600',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {checklistResults.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 transition-colors',
                item.checked
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-gray-50 dark:bg-gray-800/50',
              )}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={cn(
                  'flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors',
                  item.checked
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'border-2 border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500',
                )}
                aria-label={item.checked ? `Desmarcar ${item.label}` : `Marcar ${item.label}`}
              >
                {item.checked && <Check className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="flex flex-1 cursor-pointer items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    'text-sm',
                    item.checked
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400',
                  )}
                >
                  {item.label}
                </span>
                {item.required && !item.checked && (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                )}
              </button>
            </div>
          ))}
        </div>

        {!requiredItemsValid && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Complete todos os itens obrigatórios antes de enviar para Discovery. Itens com ícone
                de alerta são obrigatórios.
              </span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
