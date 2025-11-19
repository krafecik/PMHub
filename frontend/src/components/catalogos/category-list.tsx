'use client'

import { CatalogCategory } from '@/lib/catalogos-api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, Settings2 } from 'lucide-react'
import React from 'react'

interface CategoryListProps {
  categories: CatalogCategory[]
  selectedId?: string | null
  onSelect: (categoriaId: string) => void
  onCreate: () => void
  onEdit: (categoria: CatalogCategory) => void
}

export function CategoryList({
  categories,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
}: CategoryListProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Catálogos Disponíveis
          </h3>
          <p className="text-xs text-muted-foreground/80">
            Personalize valores usados nas telas do produto
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {categories.length === 0 && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria configurada para este contexto ainda.
            </div>
          )}

          {categories.map((categoria) => {
            const isSelected = categoria.id === selectedId
            return (
              <button
                key={categoria.id}
                onClick={() => onSelect(categoria.id)}
                className={cn(
                  'group flex w-full flex-col items-start rounded-lg border border-transparent px-4 py-3 text-left transition',
                  isSelected
                    ? 'border-primary/60 bg-primary/5 shadow-sm'
                    : 'hover:border-primary/20 hover:bg-muted/40',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-semibold">{categoria.nome}</span>
                    {categoria.escopoProduto && (
                      <Badge variant="outline" className="border-primary/40 text-[10px] uppercase">
                        Por produto
                      </Badge>
                    )}
                    {categoria.deletedAt && (
                      <Badge variant="destructive" className="text-[10px] uppercase">
                        Arquivada
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 transition group-hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(categoria)
                    }}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">Editar categoria</span>
                  </Button>
                </div>
                <div className="mt-1 flex w-full items-center justify-between text-xs text-muted-foreground">
                  <span>Slug: {categoria.slug}</span>
                  <span>{categoria.itensCount ?? 0} itens</span>
                </div>
                {categoria.descricao && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {categoria.descricao}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
