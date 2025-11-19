'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import type {
  CommitmentTierItem,
  PlanejamentoCommitmentDetalhe,
  PlanningCommitment,
} from '@/lib/planejamento-api'

type TierKey = 'committed' | 'targeted' | 'aspirational'

interface NormalizedTier {
  key: TierKey
  id: string
  label: string
  itens: CommitmentTierItem[]
  metadata?: Record<string, unknown> | null
}

interface CommitmentSummaryProps {
  commitment?: PlanningCommitment | PlanejamentoCommitmentDetalhe | null
}

const fallbackColors: Record<TierKey, { title: string; badge: BadgeProps['variant'] }> = {
  committed: { title: 'Committed', badge: 'success' },
  targeted: { title: 'Targeted', badge: 'warning' },
  aspirational: { title: 'Aspirational', badge: 'secondary' },
}

const allowedVariants: BadgeProps['variant'][] = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'success',
  'warning',
  'info',
]

function getMetadataString(tier: NormalizedTier, key: string): string | undefined {
  const metadata = tier.metadata as Record<string, unknown> | null | undefined
  if (!metadata) return undefined
  const value = metadata[key]
  return typeof value === 'string' ? value : undefined
}

function getMetadataNumber(tier: NormalizedTier, key: string): number | undefined {
  const metadata = tier.metadata as Record<string, unknown> | null | undefined
  if (!metadata) return undefined
  const value = metadata[key]
  return typeof value === 'number' ? value : undefined
}

function resolveBadgeVariant(tier: NormalizedTier): React.ComponentProps<typeof Badge>['variant'] {
  const configured = getMetadataString(tier, 'badgeVariant')
  if (configured && allowedVariants.includes(configured as BadgeProps['variant'])) {
    return configured as BadgeProps['variant']
  }

  const fallback = fallbackColors[tier.key]
  return fallback?.badge ?? 'outline'
}

function resolveTitle(tier: NormalizedTier): string {
  const label = tier.label ?? fallbackColors[tier.key]?.title
  if (label) return label

  const legacy = getMetadataString(tier, 'legacyValue')
  if (legacy) return legacy.charAt(0) + legacy.slice(1).toLowerCase()

  return tier.key.charAt(0).toUpperCase() + tier.key.slice(1)
}

function isPlanningCommitment(
  commitment: PlanningCommitment | PlanejamentoCommitmentDetalhe | null | undefined,
): commitment is PlanningCommitment {
  return Array.isArray((commitment as PlanningCommitment | undefined)?.tiers)
}

function normalizeTiers(
  commitment?: PlanningCommitment | PlanejamentoCommitmentDetalhe | null,
): NormalizedTier[] {
  const keys: TierKey[] = ['committed', 'targeted', 'aspirational']

  return keys.map<NormalizedTier>((key) => {
    let metadata: Record<string, unknown> | null | undefined
    let label = fallbackColors[key].title
    let id: string = key

    if (isPlanningCommitment(commitment)) {
      const tier = commitment.tiers.find((item) => item.key === key)
      if (tier) {
        metadata = tier.metadata ?? null
        label = tier.label ?? label
        id = tier.id ?? tier.slug ?? key
      }
    } else if (commitment && 'tiers' in (commitment as PlanejamentoCommitmentDetalhe)) {
      const tierObj = (commitment as PlanejamentoCommitmentDetalhe).tiers?.[key]
      if (tierObj?.nome) {
        label = tierObj.nome
      }
      if (tierObj?.id) {
        id = tierObj.id
      }
    }

    const itensFromItinerary =
      (commitment?.itens && (commitment.itens as Record<string, CommitmentTierItem[]>)[key]) ?? []

    const fallbackItens = isPlanningCommitment(commitment)
      ? ((commitment[key] as CommitmentTierItem[]) ?? [])
      : []

    return {
      key,
      id,
      label,
      metadata: metadata ?? null,
      itens: itensFromItinerary.length > 0 ? itensFromItinerary : fallbackItens,
    }
  })
}

export function CommitmentSummary({ commitment }: CommitmentSummaryProps) {
  const tiers = normalizeTiers(commitment).sort((a, b) => {
    const orderA = getMetadataNumber(a, 'order') ?? Number.MAX_SAFE_INTEGER
    const orderB = getMetadataNumber(b, 'order') ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB
  })

  if (!commitment || tiers.length === 0) {
    return (
      <Card variant="ghost" className="p-6 text-center text-text-secondary">
        Nenhum commitment registrado para este quarter.
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tiers.map((tier) => {
        const itens = tier.itens ?? []
        return (
          <Card key={tier.id} variant="outline" className="p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-text-primary">{resolveTitle(tier)}</h4>
              <Badge variant={resolveBadgeVariant(tier)}>{itens.length} épicos</Badge>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              {itens.length === 0 && <li>Nenhum épico definido.</li>}
              {itens.slice(0, 4).map((item) => (
                <li key={item.epicoId} className="truncate font-medium text-text-primary">
                  • {item.titulo}
                </li>
              ))}
              {itens.length > 4 && (
                <li className="text-xs text-text-muted">+{itens.length - 4} outros</li>
              )}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
