'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'

export interface StatItem {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
}

interface StatsHeaderProps {
  stats: StatItem[]
  className?: string
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  secondary: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  accent: 'bg-accent-50 text-accent-700 border-accent-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
}

export function StatsHeader({ stats, className }: StatsHeaderProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-lg border bg-background p-2.5 shadow-sm transition-all hover:shadow-sm"
        >
          {/* Background Pattern */}
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 translate-y-[-50%] transform opacity-10">
            <div className="h-full w-full rounded-full bg-primary-600" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-text-secondary">{stat.label}</p>
                <p className="mt-0.5 text-lg font-semibold text-text-primary">{stat.value}</p>
              </div>
              {stat.icon && (
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md',
                    stat.color ? colorClasses[stat.color] : 'bg-primary-50 text-primary-600',
                  )}
                >
                  {stat.icon}
                </div>
              )}
            </div>

            {stat.change !== undefined && (
              <div className="mt-3 flex items-center gap-2">
                {stat.trend === 'up' ? (
                  <>
                    <ArrowUp className="text-success-DEFAULT h-4 w-4" />
                    <span className="text-success-DEFAULT text-sm font-medium">
                      +{stat.change}%
                    </span>
                  </>
                ) : stat.trend === 'down' ? (
                  <>
                    <ArrowDown className="text-error-DEFAULT h-4 w-4" />
                    <span className="text-error-DEFAULT text-sm font-medium">{stat.change}%</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-text-secondary">{stat.change}%</span>
                )}
                <span className="text-sm text-text-muted">vs. mês anterior</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Mini Chart Component for stats
export function MiniChart({ data, color = 'primary' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className="flex h-8 items-end gap-0.5">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100
        return (
          <motion.div
            key={index}
            className={cn(
              'w-1 rounded-full',
              color === 'primary' && 'bg-primary-500',
              color === 'success' && 'bg-green-500',
              color === 'warning' && 'bg-amber-500',
              color === 'error' && 'bg-red-500',
            )}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: index * 0.05 }}
          />
        )
      })}
    </div>
  )
}
