import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { DocumentoCard } from './documento-card'
import { HelpButton } from '@/components/ui/help-button'
import { Plus, Search } from 'lucide-react'
import { useListarDocumentos } from '@/hooks/use-documentos'
import { useListarProdutos } from '@/hooks/use-produtos'
import type { DocumentoListItem } from '@/types/documentacao'

const TIPOS_DOCUMENTO = [
  { value: 'PRD', label: 'PRD' },
  { value: 'BRD', label: 'BRD' },
  { value: 'RFC', label: 'RFC' },
  { value: 'SPEC', label: 'Specs' },
  { value: 'RELEASE_NOTE', label: 'Release Notes' },
  { value: 'UX_DOC', label: 'UX Doc' },
]

const STATUS_DOCUMENTO = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'REVISAO', label: 'Em revisão' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'OBSOLETO', label: 'Obsoleto' },
]

interface DocumentosListaProps {
  onSelecionarDocumento?: (documento: DocumentoListItem) => void
  onAbrirHistorico?: (documento: DocumentoListItem) => void
  onGerarPdf?: (documento: DocumentoListItem) => void
  onGerenciarVinculos?: (documento: DocumentoListItem) => void
}

export function DocumentosLista({
  onSelecionarDocumento,
  onAbrirHistorico,
  onGerarPdf,
  onGerenciarVinculos,
}: DocumentosListaProps) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<string>()
  const [status, setStatus] = useState<string>()
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>()

  const { data: produtos } = useListarProdutos()
  const { data, isLoading, isFetching } = useListarDocumentos(
    useMemo(
      () => ({
        termo: busca || undefined,
        tipos: tipo ? [tipo] : undefined,
        status: status ? [status] : undefined,
        produtoId: produtoSelecionado,
      }),
      [busca, tipo, status, produtoSelecionado],
    ),
  )

  const loading = isLoading || isFetching

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Documentação de Produto</h1>
            <p className="text-sm text-text-secondary">
              PRDs, BRDs, RFCs, Specs e Release Notes organizados em um só lugar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HelpButton
              title="Como usar a biblioteca de documentos"
              content={
                <p>
                  Filtre por tipo, status ou produto, abra o editor de PRD em abas e acompanhe
                  histórico de versões e vínculos de cada documento.
                </p>
              }
            />
            <Button onClick={() => router.push('/documentacao/novo')} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Documento
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por título ou resumo..."
                className="pl-9"
              />
            </div>
          </div>
          <Select
            value={tipo}
            onValueChange={(value) => setTipo(value === 'todos' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TIPOS_DOCUMENTO.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value === 'todos' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_DOCUMENTO.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={produtoSelecionado}
            onValueChange={(value) => setProdutoSelecionado(value === 'todos' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os produtos</SelectItem>
              {(
                produtos?.map((produto) => ({
                  label: produto.nome,
                  value: produto.id.toString(),
                })) || []
              ).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {!loading && data?.itens?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-8 text-center">
          <h3 className="text-base font-semibold text-text-primary">Nenhum documento encontrado</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Ajuste os filtros ou crie um novo documento para iniciar a documentação.
          </p>
        </div>
      )}

      {!loading && data?.itens && data.itens.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.itens.map((documento) => (
            <DocumentoCard
              key={documento.id}
              documento={documento}
              onAbrir={(doc) =>
                onSelecionarDocumento
                  ? onSelecionarDocumento(doc)
                  : router.push(`/documentacao/${doc.id}`)
              }
              onHistorico={onAbrirHistorico}
              onVinculos={onGerenciarVinculos}
              onDownload={onGerarPdf}
            />
          ))}
        </div>
      )}
    </div>
  )
}
