'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HealthMetric {
  name: string
  value: number
  target: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description?: string
}

interface ProductHealthProps {
  product: string
  metrics: HealthMetric[]
}

const statusConfig = {
  good: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-success-DEFAULT',
    bg: 'bg-success-light/10',
    progressColor: 'bg-success-DEFAULT',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-warning-DEFAULT',
    bg: 'bg-warning-light/10',
    progressColor: 'bg-warning-DEFAULT',
  },
  critical: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-error-DEFAULT',
    bg: 'bg-error-light/10',
    progressColor: 'bg-error-DEFAULT',
  },
}

const trendIcons = {
  up: <TrendingUp className="h-3 w-3" />,
  down: <TrendingDown className="h-3 w-3" />,
  stable: <Info className="h-3 w-3" />,
}

export function ProductHealth({ product, metrics }: ProductHealthProps) {
  const overallHealth = Math.round(
    metrics.reduce((acc, metric) => acc + (metric.value / metric.target) * 100, 0) / metrics.length,
  )

  const overallStatus = overallHealth >= 80 ? 'good' : overallHealth >= 60 ? 'warning' : 'critical'

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Saúde do Produto</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{product}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'gap-1',
              statusConfig[overallStatus].color,
              statusConfig[overallStatus].bg,
            )}
          >
            {statusConfig[overallStatus].icon}
            <span className="font-medium">{overallHealth}%</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => {
            const percentage = Math.round((metric.value / metric.target) * 100)
            const config = statusConfig[metric.status]

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{metric.name}</span>
                    <div className={cn('flex items-center gap-1', config.color)}>
                      {trendIcons[metric.trend]}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">
                      {metric.value} / {metric.target}
                    </span>
                    <Badge variant="secondary" className={cn('text-xs', config.color)}>
                      {percentage}%
                    </Badge>
                  </div>
                </div>

                <Progress value={percentage} className="h-2" />

                {metric.description && (
                  <p className="text-xs text-text-muted">{metric.description}</p>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-lg bg-secondary-50 p-3">
          <p className="text-xs text-text-muted">
            💡 <span className="font-medium">Dica:</span> Mantenha as métricas acima de 80% para
            garantir a saúde do produto
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
