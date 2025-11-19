'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EditorPrd } from '@/components/documentacao/editor-prd'
import { HistoricoVersoes } from '@/components/documentacao/historico-versoes'
import { VinculosDocumento } from '@/components/documentacao/vinculos-documento'
import { ComentariosDocumento } from '@/components/documentacao/comentarios-documento'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GitCommit, MessageSquare } from 'lucide-react'
import { HelpButton } from '@/components/ui/help-button'
import {
  useAtualizarDocumentoCabecalho,
  useAtualizarDocumentoSecoes,
  useCriarDocumentoVersao,
  useDocumento,
  useCompararVersoesDocumento,
} from '@/hooks/use-documentos'
import { toast } from 'sonner'

export default function DocumentoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const documentoId = params?.id

  const { data: documento, isLoading } = useDocumento(documentoId)
  const atualizarCabecalho = useAtualizarDocumentoCabecalho(documentoId ?? '')
  const atualizarSecoes = useAtualizarDocumentoSecoes(documentoId ?? '')
  const criarVersao = useCriarDocumentoVersao(documentoId ?? '')

  const [versaoComparacao, setVersaoComparacao] = useState<string>()
  const comparacao = useCompararVersoesDocumento(
    documentoId,
    documento?.versaoAtual?.id,
    versaoComparacao,
  )

  const versoes = useMemo(() => documento?.versoes ?? [], [documento])

  if (!documentoId) {
    return null
  }

  if (isLoading || !documento) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => router.push('/documentacao')}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <SkeletonCard />
      </div>
    )
  }

  async function handleAtualizarCabecalho(
    payload: Parameters<typeof atualizarCabecalho.mutateAsync>[0],
  ) {
    try {
      await atualizarCabecalho.mutateAsync(payload)
      toast.success('Cabeçalho atualizado com sucesso!')
    } catch (error) {
      toast.error('Não foi possível atualizar o cabeçalho.')
    }
  }

  async function handleAtualizarSecoes(payload: Parameters<typeof atualizarSecoes.mutateAsync>[0]) {
    try {
      await atualizarSecoes.mutateAsync(payload)
      toast.success('Seção atualizada com sucesso!')
    } catch (error) {
      toast.error('Não foi possível atualizar a seção.')
    }
  }

  async function handleCriarVersao(payload: Parameters<typeof criarVersao.mutateAsync>[0]) {
    try {
      await criarVersao.mutateAsync(payload)
      toast.success('Nova versão criada!')
    } catch (error) {
      toast.error('Não foi possível criar a nova versão.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => router.push('/documentacao')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-text-primary">{documento.titulo}</h1>
            <span className="text-xs text-muted-foreground">
              Tipo {documento.tipo} • Status {documento.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            Exportar PDF
          </Button>
          <HelpButton
            title="Como editar o PRD"
            content={
              <div className="space-y-3">
                <p>
                  Atualize o cabeçalho, objetivo e contexto antes de ajustar as seções detalhadas.
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Use as abas para manter requisitos, regras, fluxos, critérios e riscos.</li>
                  <li>Crie novas versões quando houver mudanças relevantes no escopo.</li>
                  <li>Compare versões para destacar alterações antes do handoff.</li>
                </ul>
              </div>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <EditorPrd
          documento={documento}
          onAtualizarCabecalho={handleAtualizarCabecalho}
          onAtualizarSecoes={handleAtualizarSecoes}
          onCriarNovaVersao={handleCriarVersao}
        />
        <div className="space-y-4">
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="flex items-center gap-2 pb-3">
              <GitCommit className="text-primary h-4 w-4" />
              <h3 className="text-base font-semibold text-text-primary">Histórico de versões</h3>
            </div>
            <HistoricoVersoes
              versoes={versoes}
              versaoAtualId={documento.versaoAtual?.id}
              onComparar={(versaoId) => setVersaoComparacao(versaoId)}
            />
            {versaoComparacao && comparacao.data && (
              <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
                Comparando versão {comparacao.data.versaoA.versao} com{' '}
                {comparacao.data.versaoB.versao}. Utilize o editor para avaliar diferenças nas
                seções.
              </div>
            )}
          </div>

          <VinculosDocumento vinculos={[]} titulo="Vínculos" />

          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="flex items-center gap-2 pb-3">
              <MessageSquare className="text-primary h-4 w-4" />
              <h3 className="text-base font-semibold text-text-primary">Comentários</h3>
            </div>
            <ComentariosDocumento comentarios={[]} />
          </div>
        </div>
      </div>
    </div>
  )
}
