'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Bug,
  Rocket,
  Package2,
  Clock,
  MoreHorizontal,
  MessageCircle,
  Paperclip,
  Eye,
  Edit,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeDate } from '@/lib/utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export interface DemandaCardProps {
  demanda: {
    id: string
    titulo: string
    descricao?: string | null
    tipo: string
    tipoLabel: string
    origem: string
    origemLabel: string
    prioridade: string
    prioridadeLabel: string
    status: string
    statusLabel: string
    produtoNome: string
    createdAt: string
    comentariosCount?: number
    anexosCount?: number
  }
  onClick?: () => void
  onEdit?: () => void
  onArchive?: () => void
  index?: number
}

const tipoIcons = {
  IDEIA: Lightbulb,
  PROBLEMA: Bug,
  OPORTUNIDADE: Rocket,
  OUTRO: Package2,
} as const

const prioridadeColors = {
  CRITICA: 'destructive',
  ALTA: 'warning',
  MEDIA: 'secondary',
  BAIXA: 'outline',
} as const

const statusColors = {
  NOVO: 'success',
  RASCUNHO: 'secondary',
  TRIAGEM: 'warning',
  ARQUIVADO: 'outline',
} as const

const tipoColors = {
  IDEIA: 'bg-amber-50 text-amber-700 border-amber-200',
  PROBLEMA: 'bg-red-50 text-red-700 border-red-200',
  OPORTUNIDADE: 'bg-blue-50 text-blue-700 border-blue-200',
  OUTRO: 'bg-gray-50 text-gray-700 border-gray-200',
} as const

export function DemandaCard({ demanda, onClick, onEdit, onArchive, index = 0 }: DemandaCardProps) {
  const Icon = tipoIcons[demanda.tipo as keyof typeof tipoIcons] || Package2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card
        variant="elevated"
        className={cn(
          'h-full cursor-pointer transition-all duration-200',
          'hover:border-primary-200 hover:shadow-lg',
          'group-hover:ring-2 group-hover:ring-primary-100',
        )}
        onClick={onClick}
      >
        <div className="flex h-full flex-col p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border',
                tipoColors[demanda.tipo as keyof typeof tipoColors],
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex items-center gap-1">
              <Badge
                variant={
                  statusColors[demanda.status as keyof typeof statusColors] || ('secondary' as any)
                }
                className="text-xs"
              >
                {demanda.statusLabel}
              </Badge>

              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    title="Editar demanda"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="animate-in fade-in-0 zoom-in-95 z-50 min-w-[160px] rounded-lg border bg-background p-1.5 shadow-lg"
                      sideOffset={5}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary-100"
                        onSelect={() => onClick?.()}
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </DropdownMenu.Item>
                      {onEdit && (
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary-100"
                          onSelect={(e) => {
                            e.preventDefault()
                            onEdit()
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenu.Item>
                      )}
                      {onArchive && (
                        <>
                          <DropdownMenu.Separator className="my-1 h-px bg-border" />
                          <DropdownMenu.Item
                            className="text-error-DEFAULT flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary-100"
                            onSelect={onArchive}
                          >
                            <Package2 className="h-4 w-4" />
                            Arquivar
                          </DropdownMenu.Item>
                        </>
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-text-primary">
              {demanda.titulo}
            </h3>

            {demanda.descricao && (
              <p className="mb-3 line-clamp-2 text-xs text-text-secondary">{demanda.descricao}</p>
            )}

            {/* Tags */}
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {demanda.tipoLabel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {demanda.origemLabel}
              </Badge>
              <Badge
                variant={
                  prioridadeColors[demanda.prioridade as keyof typeof prioridadeColors] as any
                }
                className="text-xs"
              >
                {demanda.prioridadeLabel}
              </Badge>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-muted">{demanda.produtoNome}</span>
              <div className="flex items-center gap-1 text-text-muted">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{formatRelativeDate(demanda.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {demanda.comentariosCount !== undefined && demanda.comentariosCount > 0 && (
                <div className="flex items-center gap-1 text-text-muted">
                  <MessageCircle className="h-3 w-3" />
                  <span className="text-xs">{demanda.comentariosCount}</span>
                </div>
              )}
              {demanda.anexosCount !== undefined && demanda.anexosCount > 0 && (
                <div className="flex items-center gap-1 text-text-muted">
                  <Paperclip className="h-3 w-3" />
                  <span className="text-xs">{demanda.anexosCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
