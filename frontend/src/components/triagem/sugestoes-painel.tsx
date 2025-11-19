'use client'

import * as React from 'react'
import { Copy, Lightbulb, Sparkles } from 'lucide-react'
import { TriagemSugestao } from '@/lib/triagem-api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface SugestoesPainelProps {
  sugestoes: TriagemSugestao[]
  loading?: boolean
  className?: string
}

const tipoIcones: Record<
  TriagemSugestao['tipo'],
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  duplicatas: Copy,
  discovery: Lightbulb,
  acao: Sparkles,
}

const prioridadeEstilos: Record<TriagemSugestao['prioridade'], { badge: string; label: string }> = {
  alta: {
    badge: 'bg-red-600 text-white dark:bg-red-500',
    label: 'Prioridade alta',
  },
  media: {
    badge: 'bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950',
    label: 'Prioridade média',
  },
  baixa: {
    badge: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
    label: 'Prioridade baixa',
  },
}

export function SugestoesPainel({ sugestoes, loading = false, className }: SugestoesPainelProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!sugestoes || sugestoes.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-3 text-sm text-muted-foreground',
          className,
        )}
      >
        Nenhuma sugestão automática no momento.
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {sugestoes.map((sugestao, index) => {
        const Icon = tipoIcones[sugestao.tipo] ?? Sparkles
        const prioridade = prioridadeEstilos[sugestao.prioridade]
        return (
          <div
            key={`${sugestao.tipo}-${index}`}
            className="hover:border-primary/50 rounded-lg border border-border/60 bg-card/70 p-4 shadow-sm transition hover:shadow-md dark:border-border/30 dark:bg-card/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary dark:bg-primary/20 mt-0.5 flex h-9 w-9 items-center justify-center rounded-full">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{sugestao.titulo}</p>
                    <Badge className={cn('text-xs font-medium', prioridade.badge)}>
                      {prioridade.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{sugestao.descricao}</p>
                </div>
              </div>
            </div>

            {sugestao.relacionados && sugestao.relacionados.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sugestao.relacionados.map((relacionado) => (
                  <Badge
                    key={relacionado.id}
                    variant="outline"
                    className="border-primary/30 bg-primary/5 text-primary dark:border-primary/40 dark:text-primary-foreground text-xs"
                  >
                    {relacionado.titulo}
                    {relacionado.referencia ? ` • ${relacionado.referencia}` : ''}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
