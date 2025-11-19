import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DiscoveryCompleto, getStatusDiscoveryVariant } from '@/lib/discovery-api'

type DiscoveryOverviewProps = {
  discovery: DiscoveryCompleto
}

export function DiscoveryOverview({ discovery }: DiscoveryOverviewProps) {
  const stats = [
    { label: 'Hipóteses', value: discovery.hipoteses.length },
    { label: 'Pesquisas', value: discovery.pesquisas.length },
    { label: 'Insights', value: discovery.insights.length },
    { label: 'Experimentos', value: discovery.experimentos.length },
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant={getStatusDiscoveryVariant(discovery.status)}>
            {discovery.statusLabel ?? discovery.status}
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold text-text-primary">{discovery.titulo}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Produto:{' '}
            <span className="font-medium">
              {discovery.produtoNome ?? `#${discovery.produtoId}`}
            </span>{' '}
            · PM:{' '}
            <span className="font-medium">
              {discovery.responsavelNome ?? `#${discovery.responsavelId}`}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Criado em {new Date(discovery.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2 md:w-auto md:min-w-[320px]">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-background/60 p-4 text-center shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
