'use client'

import * as React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TriagemSinal } from '@/lib/triagem-api'
import { Skeleton } from '@/components/ui/skeleton'

interface SinaisPainelProps {
  sinais: TriagemSinal[]
  loading?: boolean
  className?: string
}

const severidadeStyles: Record<
  TriagemSinal['severidade'],
  { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; container: string; badge: string }
> = {
  danger: {
    icon: AlertCircle,
    container:
      'border-red-200/60 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200',
    badge: 'bg-red-600/90 text-white dark:bg-red-500/80',
  },
  warning: {
    icon: AlertTriangle,
    container:
      'border-amber-200/60 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-900/40 dark:text-amber-100',
    badge: 'bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950',
  },
  success: {
    icon: CheckCircle2,
    container:
      'border-emerald-200/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-900/40 dark:text-emerald-100',
    badge: 'bg-emerald-500 text-emerald-950 dark:bg-emerald-400 dark:text-emerald-950',
  },
}

export function SinaisPainel({ sinais, loading = false, className }: SinaisPainelProps) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (!sinais || sinais.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-3 text-sm text-muted-foreground',
          className,
        )}
      >
        Nenhum sinal relevante no momento.
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {sinais.map((sinal) => {
        const estilo = severidadeStyles[sinal.severidade]
        const Icon = estilo.icon
        return (
          <div
            key={sinal.tipo}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors',
              estilo.container,
            )}
          >
            <div className="mt-0.5 rounded-full bg-white/60 p-1 dark:bg-white/10">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm',
                    estilo.badge,
                  )}
                >
                  {sinal.titulo}
                </span>
              </div>
              <p className="text-current/90 text-sm leading-snug">{sinal.descricao}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
