'use client'

import { useQuery } from '@tanstack/react-query'
import { Clock, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeDate } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'

interface UpdateLog {
  id: string
  tipo: 'EPICO' | 'FEATURE' | 'DEPENDENCIA' | 'COMMITMENT' | 'CENARIO'
  acao: string
  campo?: string
  valorAnterior?: string
  valorNovo?: string
  usuarioNome?: string
  createdAt: string
}

interface UpdatesLogProps {
  tipo: 'EPICO' | 'FEATURE'
  entidadeId: string
}

export function UpdatesLog({ tipo, entidadeId }: UpdatesLogProps) {
  const { data: updates = [], isLoading } = useQuery<UpdateLog[]>({
    queryKey: ['updates-log', tipo, entidadeId],
    queryFn: async () => {
      const response = await apiFetch<UpdateLog[]>(
        `/planejamento/updates-log?tipo=${tipo}&entidadeId=${entidadeId}`,
      )
      return response ?? []
    },
    enabled: !!entidadeId,
  })

  if (isLoading) {
    return (
      <Card variant="outline" className="p-6">
        <p className="text-sm text-text-secondary">Carregando histórico...</p>
      </Card>
    )
  }

  if (updates.length === 0) {
    return (
      <Card variant="outline" className="p-6">
        <p className="text-sm text-text-secondary">
          Nenhum update registrado ainda. O histórico de mudanças será exibido aqui.
        </p>
      </Card>
    )
  }

  const getAcaoColor = (acao: string) => {
    if (acao.includes('criado') || acao.includes('criada')) return 'success'
    if (acao.includes('atualizado') || acao.includes('atualizada')) return 'info'
    if (acao.includes('removido') || acao.includes('removida')) return 'destructive'
    return 'secondary'
  }

  return (
    <Card variant="outline" className="p-6">
      <h3 className="mb-4 font-semibold text-text-primary">Histórico de Mudanças</h3>
      <div className="space-y-4">
        {updates.map((update) => (
          <div key={update.id} className="flex gap-4 border-b border-border pb-4 last:border-0">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getAcaoColor(update.acao)} className="text-xs">
                  {update.acao}
                </Badge>
                {update.campo && (
                  <span className="text-xs text-text-muted">no campo {update.campo}</span>
                )}
              </div>
              {update.valorAnterior && update.valorNovo && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">De:</span>
                    <span className="text-text-secondary line-through">{update.valorAnterior}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Para:</span>
                    <span className="font-medium text-text-primary">{update.valorNovo}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-text-muted">
                {update.usuarioNome && (
                  <>
                    <User className="h-3 w-3" />
                    <span>{update.usuarioNome}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatRelativeDate(new Date(update.createdAt))}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
