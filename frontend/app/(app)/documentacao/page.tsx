'use client'

import { useRouter } from 'next/navigation'
import { DocumentosLista } from '@/components/documentacao/documentos-lista'
import type { DocumentoListItem } from '@/types/documentacao'

export default function DocumentacaoPage() {
  const router = useRouter()

  function handleSelecionar(documento: DocumentoListItem) {
    router.push(`/documentacao/${documento.id}`)
  }

  function handleExportarPdf(documento: DocumentoListItem) {
    window.open(`/documentacao/${documento.id}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <DocumentosLista onSelecionarDocumento={handleSelecionar} onGerarPdf={handleExportarPdf} />
    </div>
  )
}
