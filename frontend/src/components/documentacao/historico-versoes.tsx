'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DocumentoVersao } from '@/types/documentacao'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GitCommit, RefreshCcw } from 'lucide-react'

interface HistoricoVersoesProps {
  versoes: DocumentoVersao[]
  versaoAtualId?: string
  onComparar?: (versaoId: string) => void
  onReverter?: (versaoId: string) => void
}

export function HistoricoVersoes({
  versoes,
  versaoAtualId,
  onComparar,
  onReverter,
}: HistoricoVersoesProps) {
  if (!versoes.length) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        Nenhuma versão registrada até o momento.
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[420px] rounded-lg border border-border/60">
      <div className="divide-y divide-border/80">
        {versoes.map((versao) => {
          const isAtual = versao.id === versaoAtualId
          return (
            <div
              key={versao.id}
              className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <GitCommit className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">Versão {versao.versao}</span>
                      {isAtual && (
                        <Badge variant="outline" className="text-xs uppercase">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {versao.createdAt
                        ? format(new Date(versao.createdAt), "dd 'de' MMM yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })
                        : 'Data não informada'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onComparar && (
                    <Button size="sm" variant="ghost" onClick={() => onComparar(versao.id ?? '')}>
                      Comparar
                    </Button>
                  )}
                  {onReverter && !isAtual && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2"
                      onClick={() => onReverter(versao.id ?? '')}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Reverter
                    </Button>
                  )}
                </div>
              </div>
              {versao.changelogResumo && (
                <p className="text-sm text-muted-foreground">Changelog: {versao.changelogResumo}</p>
              )}
              {versao.createdBy && (
                <span className="text-xs text-muted-foreground">Criada por {versao.createdBy}</span>
              )}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
