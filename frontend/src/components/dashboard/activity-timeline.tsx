'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FileText,
  Lightbulb,
  CheckCircle,
  MessageSquare,
  GitBranch,
  Rocket,
  AlertCircle,
} from 'lucide-react'
import { formatRelativeDate, getInitials } from '@/lib/utils'

interface Activity {
  id: string
  type: 'ideia' | 'discovery' | 'feature' | 'validacao' | 'comentario' | 'decisao'
  title: string
  description?: string
  user: {
    name: string
    avatar?: string
  }
  timestamp: Date
  status?: 'success' | 'warning' | 'error' | 'info'
  metadata?: Record<string, unknown>
}

interface ActivityTimelineProps {
  activities: Activity[]
  showAll?: boolean
}

const activityIcons = {
  ideia: <Lightbulb className="h-4 w-4" />,
  discovery: <FileText className="h-4 w-4" />,
  feature: <GitBranch className="h-4 w-4" />,
  validacao: <CheckCircle className="h-4 w-4" />,
  comentario: <MessageSquare className="h-4 w-4" />,
  decisao: <AlertCircle className="h-4 w-4" />,
}

const statusColors = {
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  error: 'bg-error-light text-error-dark',
  info: 'bg-info-light text-info-dark',
}

export function ActivityTimeline({ activities, showAll = false }: ActivityTimelineProps) {
  const displayedActivities = showAll ? activities : activities.slice(0, 5)

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Atividade Recente</CardTitle>
        {!showAll && activities.length > 5 && (
          <a
            href="/activities"
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            Ver todas
          </a>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Linha vertical conectando os itens */}
          <div className="absolute bottom-5 left-5 top-5 w-px bg-border" />

          {displayedActivities.map((activity) => (
            <div key={activity.id} className="relative flex gap-4">
              {/* Avatar com ícone da atividade */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-white" />
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(activity.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
                    activity.status
                      ? statusColors[activity.status]
                      : 'bg-secondary-200 text-secondary-700'
                  }`}
                >
                  {activityIcons[activity.type]}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                    {activity.description && (
                      <p className="mt-1 text-sm text-text-secondary">{activity.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span>{activity.user.name}</span>
                      <span>•</span>
                      <span>{formatRelativeDate(activity.timestamp)}</span>
                      {activity.metadata?.produto &&
                      typeof activity.metadata.produto === 'string' ? (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {activity.metadata.produto}
                          </Badge>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {activity.metadata?.actionUrl &&
                  typeof activity.metadata.actionUrl === 'string' ? (
                    <a
                      href={activity.metadata.actionUrl}
                      className="shrink-0 rounded-lg px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      Ver detalhes
                    </a>
                  ) : null}
                </div>

                {/* Metadados adicionais */}
                {activity.metadata?.tags && Array.isArray(activity.metadata.tags) ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {activity.metadata.tags.map((tag: unknown, tagIndex: number) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {String(tag)}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="py-8 text-center">
              <Rocket className="mx-auto h-8 w-8 text-text-muted opacity-40" />
              <p className="mt-3 text-sm text-text-muted">Nenhuma atividade recente</p>
              <p className="mt-1 text-xs text-text-muted">
                As atividades aparecerão aqui quando você começar a usar o sistema
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
