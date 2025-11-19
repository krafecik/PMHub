'use client'

import * as React from 'react'
import { CatalogItem } from '@/lib/catalogos-api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ItemTableProps {
  items: CatalogItem[]
  onCreate: () => void
  onEdit: (item: CatalogItem) => void
  onDelete: (item: CatalogItem) => void
  isLoading?: boolean
}

export function ItemTable({ items, onCreate, onEdit, onDelete, isLoading }: ItemTableProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Itens da Categoria
          </h3>
          <p className="text-xs text-muted-foreground/80">
            Edite a ordem, rótulos e disponibilidade de cada valor
          </p>
        </div>
        <Button size="sm" variant="gradient" onClick={onCreate}>
          Adicionar item
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Label</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden lg:table-cell">Produto</TableHead>
              <TableHead className="hidden text-center lg:table-cell">Ordem</TableHead>
              <TableHead className="hidden text-center md:table-cell">Status</TableHead>
              <TableHead className="w-[60px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    Carregando itens...
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhum item cadastrado ainda.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Comece adicionando seus valores configuráveis.
                    </p>
                    <Button size="sm" onClick={onCreate}>
                      Adicionar item
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-foreground font-semibold">{item.label}</span>
                    {item.descricao && (
                      <span className="text-xs text-muted-foreground">{item.descricao}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {item.slug}
                  </code>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {item.produtoId ? (
                    <Badge variant="outline">{item.produtoId}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Todos</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-center lg:table-cell">
                  <span className="text-xs font-medium text-muted-foreground">{item.ordem}</span>
                </TableCell>
                <TableCell className="hidden text-center md:table-cell">
                  <Badge variant={item.ativo ? 'success' : 'destructive'}>
                    {item.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className={cn('flex items-center gap-2 text-sm')}
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={cn('text-destructive flex items-center gap-2 text-sm')}
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Desativar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
