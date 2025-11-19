'use client'

import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FlaskConical,
  Brain,
  Users,
  FileSearch,
  Lightbulb,
  Activity,
  Calendar,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DiscoveryListItem, getStatusDiscoveryVariant } from '@/lib/discovery-api'

interface DiscoveryCardProps {
  discovery: DiscoveryListItem
}

export function DiscoveryCard({ discovery }: DiscoveryCardProps) {
  const router = useRouter()

  const handleViewDetails = () => {
    router.push(`/discovery/${discovery.id}` as any)
  }

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    EM_PESQUISA: {
      icon: <FlaskConical className="h-4 w-4" />,
      color: 'text-blue-500',
    },
    VALIDANDO: {
      icon: <Activity className="h-4 w-4" />,
      color: 'text-amber-500',
    },
    FECHADO: {
      icon: <FileSearch className="h-4 w-4" />,
      color: 'text-green-500',
    },
    CANCELADO: {
      icon: <FileSearch className="h-4 w-4" />,
      color: 'text-gray-500',
    },
  }

  const config = statusConfig[discovery.status] || statusConfig.EM_PESQUISA

  return (
    <Card className="group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="from-primary to-primary/50 absolute inset-x-0 top-0 h-1 bg-gradient-to-r" />

      <CardHeader className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className={config.color}>{config.icon}</span>
            <span className="text-xs">Discovery #{discovery.id.slice(0, 8)}</span>
          </div>
          <Badge variant={getStatusDiscoveryVariant(discovery.status)} className="text-xs">
            {discovery.statusLabel}
          </Badge>
        </div>

        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{discovery.titulo}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{discovery.descricao}</p>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Estatísticas */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">
              <strong>{discovery.qtdHipoteses}</strong> hipóteses
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">
              <strong>{discovery.qtdPesquisas}</strong> pesquisas
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">
              <strong>{discovery.qtdInsights}</strong> insights
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">
              <strong>{discovery.qtdExperimentos}</strong> experimentos
            </span>
          </div>
        </div>

        {/* Tags */}
        {discovery.tags && discovery.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {discovery.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {discovery.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{discovery.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadados */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(discovery.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </div>
          {discovery.produtoNome && <span className="truncate">{discovery.produtoNome}</span>}
          {discovery.responsavelNome && (
            <span className="truncate">PM: {discovery.responsavelNome}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex w-full gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="group-hover:bg-primary/5 flex-1"
            onClick={handleViewDetails}
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button size="sm" className="flex-1" onClick={handleViewDetails}>
            Abrir Discovery
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
