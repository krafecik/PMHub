'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Package2,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeDate } from '@/lib/utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export interface ProdutoCardProps {
  produto: {
    id: string
    nome: string
    descricao?: string | null
    status: string
    created_at: string
    updated_at: string
    demandasCount?: number
    demandasAtivas?: number
    healthScore?: number
  }
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  index?: number
}

export function ProdutoCard({ produto, onClick, onEdit, onDelete, index = 0 }: ProdutoCardProps) {
  const isActive = produto.status === 'ACTIVE'
  const healthScore = produto.healthScore || 85
  const circumference = 2 * Math.PI * 40 // raio de 40
  const strokeDashoffset = circumference - (healthScore / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card
        variant="elevated"
        className={cn(
          'h-full cursor-pointer transition-all duration-200',
          'hover:border-primary-200 hover:shadow-xl',
          'group-hover:ring-2 group-hover:ring-primary-100',
          'relative overflow-hidden',
        )}
        data-testid={`produto-card-${produto.id}`}
        onClick={onClick}
      >
        {/* Background Pattern */}
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-16 translate-y-[-50%] transform opacity-5">
          <div className="h-full w-full rounded-full bg-primary-600" />
        </div>

        <div className="relative flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Package2 className="h-7 w-7" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary">{produto.nome}</h3>
                <Badge variant={isActive ? 'success' : 'secondary'} className="mt-1">
                  {isActive ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Inativo
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Ações do produto ${produto.nome}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="animate-in fade-in-0 zoom-in-95 z-50 min-w-[160px] rounded-lg border bg-background p-1.5 shadow-lg"
                  sideOffset={5}
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary-100"
                      onSelect={onEdit}
                    >
                      <Edit className="h-4 w-4" />
                      Editar produto
                    </DropdownMenu.Item>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item
                        className="text-error-DEFAULT flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-error-light/20"
                        onSelect={onDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover produto
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Description */}
          {produto.descricao && (
            <p className="mb-4 line-clamp-2 text-sm text-text-secondary">{produto.descricao}</p>
          )}

          {/* Stats */}
          <div className="mb-4 grid flex-1 grid-cols-3 gap-4">
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center">
                <FileText className="h-4 w-4 text-text-muted" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{produto.demandasCount || 0}</p>
              <p className="text-xs text-text-muted">Demandas</p>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center justify-center">
                <Activity className="h-4 w-4 text-text-muted" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{produto.demandasAtivas || 0}</p>
              <p className="text-xs text-text-muted">Ativas</p>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-text-muted" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{healthScore}%</p>
              <p className="text-xs text-text-muted">Saúde</p>
            </div>
          </div>

          {/* Health Ring */}
          <div className="relative mb-4 flex items-center justify-center">
            <svg className="h-24 w-24 -rotate-90 transform">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary-200"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                className={cn(
                  healthScore >= 80 && 'text-success-DEFAULT',
                  healthScore >= 60 && healthScore < 80 && 'text-warning-DEFAULT',
                  healthScore < 60 && 'text-error-DEFAULT',
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-text-primary">{healthScore}%</span>
              <span className="text-xs text-text-muted">Score</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4">
            <p className="text-center text-xs text-text-muted">
              Atualizado {formatRelativeDate(produto.updated_at)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
