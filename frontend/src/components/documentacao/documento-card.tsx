import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, History, Link2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DocumentoListItem } from '@/types/documentacao'
import { cn } from '@/lib/utils'

interface DocumentoCardProps {
  documento: DocumentoListItem
  onAbrir?: (documento: DocumentoListItem) => void
  onHistorico?: (documento: DocumentoListItem) => void
  onVinculos?: (documento: DocumentoListItem) => void
  onDownload?: (documento: DocumentoListItem) => void
}

export function DocumentoCard({
  documento,
  onAbrir,
  onHistorico,
  onVinculos,
  onDownload,
}: DocumentoCardProps) {
  const ultimaAtualizacao = documento.updatedAt || documento.createdAt

  return (
    <Card className="border border-border/60 bg-background/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-wide">
              {documento.tipo}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs uppercase', statusBadgeClass(documento.status))}
            >
              {documento.status}
            </Badge>
          </div>
          <CardTitle className="text-lg font-semibold text-text-primary">
            {documento.titulo}
          </CardTitle>
        </div>
        {documento.versaoAtual?.versao && (
          <Badge variant="outline" className="text-xs font-medium">
            Versão {documento.versaoAtual.versao}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="line-clamp-2 text-sm text-text-secondary">
          {documento.resumo || 'Sem resumo cadastrado.'}
        </div>
        <div className="text-xs text-muted-foreground">
          {ultimaAtualizacao
            ? `Atualizado ${formatDistanceToNow(new Date(ultimaAtualizacao), {
                locale: ptBR,
                addSuffix: true,
              })}`
            : 'Sem histórico'}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button size="sm" variant="secondary" onClick={() => onAbrir?.(documento)}>
            Abrir <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onHistorico?.(documento)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Histórico
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onVinculos?.(documento)}
            className="gap-2"
          >
            <Link2 className="h-4 w-4" />
            Vincular
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDownload?.(documento)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'APROVADO':
      return 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
    case 'REVISAO':
      return 'border-amber-500/40 text-amber-600 dark:text-amber-400'
    case 'OBSOLETO':
      return 'border-slate-400/40 text-slate-500 dark:text-slate-300'
    default:
      return 'border-sky-500/40 text-sky-600 dark:text-sky-400'
  }
}
