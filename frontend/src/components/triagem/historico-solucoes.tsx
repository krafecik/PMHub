'use client'

import * as React from 'react'
import { Clock, Sparkles } from 'lucide-react'
import type { HistoricoSolucao } from '@/lib/triagem-api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface HistoricoSolucoesProps {
  historico: HistoricoSolucao[]
  loading?: boolean
  className?: string
}

const statusVariantMap: Record<string, { badge: string; icon: React.ComponentType<any> }> = {
  evoluiu_epico: { badge: 'bg-purple-500 text-purple-50', icon: Sparkles },
  pronto_discovery: { badge: 'bg-blue-500 text-blue-50', icon: Clock },
}

export function HistoricoSolucoes({ historico, loading, className }: HistoricoSolucoesProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!historico || historico.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-3 text-sm text-muted-foreground',
          className,
        )}
      >
        Nenhum histórico recente encontrado para este produto.
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {historico.map((item) => {
        const variant = statusVariantMap[item.statusTriagem] ?? {
          badge:
            'bg-secondary-200 text-secondary-900 dark:bg-secondary-900/40 dark:text-secondary-100',
          icon: Clock,
        }
        const Icon = variant.icon
        return (
          <Card key={item.demandaId} variant="outline" className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="text-primary h-4 w-4" />
                  <p className="text-sm font-semibold">{item.titulo}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.tipo} • {item.produtoNome} • Similaridade {Math.round(item.similaridade)}%
                </div>
              </div>
              <Badge className={cn('text-xs font-medium', variant.badge)}>
                {item.statusTriagemLabel}
              </Badge>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
