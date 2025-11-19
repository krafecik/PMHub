'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PlanningStat {
  label: string
  value: string | number
  subLabel?: string
  icon?: ReactNode
  progress?: number
  tone?: 'emerald' | 'amber' | 'rose' | 'indigo'
}

const toneMap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500',
  indigo: 'bg-indigo-500/10 text-indigo-500',
}

export function PlanningStats({ stats }: { stats: PlanningStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} variant="elevated" className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-text-muted">{stat.label}</div>
            {stat.icon && (
              <div
                className={cn(
                  'bg-surface-highlight flex h-9 w-9 items-center justify-center rounded-full text-primary-600',
                  stat.tone && toneMap[stat.tone],
                )}
              >
                {stat.icon}
              </div>
            )}
          </div>
          <div className="mt-3 text-3xl font-semibold text-text-primary">{stat.value}</div>
          {stat.subLabel && (
            <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              {stat.subLabel}
            </div>
          )}
          {typeof stat.progress === 'number' && (
            <div className="mt-4">
              <Progress value={stat.progress} />
              <div className="mt-1 text-right text-xs text-text-muted">{stat.progress}%</div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
