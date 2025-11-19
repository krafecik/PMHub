'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { DocumentoFluxo } from '@/types/documentacao'

interface SecaoFluxosProps {
  fluxos?: DocumentoFluxo
  onSalvar: (fluxo: DocumentoFluxo) => Promise<void> | void
}

export function SecaoFluxos({ fluxos, onSalvar }: SecaoFluxosProps) {
  const [dados, setDados] = useState<DocumentoFluxo>({
    diagramaUrl: fluxos?.diagramaUrl ?? '',
    descricao: fluxos?.descricao ?? '',
  })
  const [carregando, setCarregando] = useState(false)

  function atualizar(campo: keyof DocumentoFluxo, valor: string) {
    setDados((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  async function handleSalvar() {
    setCarregando(true)
    try {
      await onSalvar(dados)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Vincule diagramas de fluxo ou descreva o passo a passo da jornada. Utilize links para Miro,
        Figma ou arquivos anexados.
      </p>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">URL do diagrama</label>
        <Input
          value={dados.diagramaUrl ?? ''}
          onChange={(event) => atualizar('diagramaUrl', event.target.value)}
          placeholder="https://miro.com/diagrama..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Descrição ou observações
        </label>
        <Textarea
          value={dados.descricao ?? ''}
          onChange={(event) => atualizar('descricao', event.target.value)}
          placeholder="Explique como o fluxo funciona e quais estados/etapas são relevantes..."
          className="min-h-[160px]"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={carregando}>
          Salvar fluxos
        </Button>
      </div>
    </div>
  )
}
