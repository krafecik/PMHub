'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
  }
  icon?: ReactNode
  href?: string
}

export function StatCard({ title, value, description, trend, icon, href }: StatCardProps) {
  const trendIcon = trend ? (
    trend.value > 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : trend.value < 0 ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    )
  ) : null

  const trendColor = trend
    ? trend.value > 0
      ? 'text-success-DEFAULT'
      : trend.value < 0
        ? 'text-error-DEFAULT'
        : 'text-text-muted'
    : ''

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        {icon && (
          <motion.div
            className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {icon}
          </motion.div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <motion.h3
          className="text-3xl font-bold tracking-tight text-text-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {value}
        </motion.h3>
        {trend && (
          <Badge variant="secondary" className={cn('gap-1', trendColor)}>
            {trendIcon}
            <span className="font-medium">{trend.value}%</span>
          </Badge>
        )}
      </div>

      {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}

      {trend?.label && <p className="mt-1 text-xs text-text-muted">{trend.label}</p>}
    </>
  )

  if (href) {
    return (
      <Card
        variant="elevated"
        className="group relative cursor-pointer transition-all hover:shadow-lg"
        padding="sm"
      >
        <a href={href} className="absolute inset-0 z-10" />
        <CardContent className="p-0">
          {content}
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" padding="sm">
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  )
}
