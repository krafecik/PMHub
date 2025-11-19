'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, FileText, Lightbulb, Calendar, ArrowRight } from 'lucide-react'

interface QuickAction {
  icon: React.ReactNode
  label: string
  description: string
  href?: string
  onClick?: () => void
  disabled?: boolean
}

const quickActions: QuickAction[] = [
  {
    icon: <Lightbulb className="h-5 w-5" />,
    label: 'Nova Ideia',
    description: 'Registre uma nova ideia ou demanda',
    href: '/demandas/new',
    disabled: true,
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: 'Iniciar Discovery',
    description: 'Comece uma nova pesquisa de produto',
    href: '/discovery/new',
    disabled: true,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: 'Criar PRD',
    description: 'Documente uma nova feature',
    href: '/documentos/new',
    disabled: true,
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: 'Planejar Sprint',
    description: 'Organize o próximo ciclo',
    href: '/planejamento/sprint',
    disabled: true,
  },
]

export function QuickActions() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto justify-start p-4 hover:border-primary-200 hover:bg-secondary-50"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <div className="flex w-full items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                {action.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-text-primary">{action.label}</p>
                <p className="text-xs text-text-muted">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
