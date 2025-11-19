'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { DocumentoContexto } from '@/types/documentacao'

interface SecaoContextoProps {
  contexto?: DocumentoContexto
  onSalvar: (contexto: DocumentoContexto) => Promise<void> | void
}

export function SecaoContexto({ contexto, onSalvar }: SecaoContextoProps) {
  const [valores, setValores] = useState<DocumentoContexto>({
    problema: contexto?.problema ?? '',
    dados: contexto?.dados ?? '',
    personas: contexto?.personas ?? '',
  })
  const [carregando, setCarregando] = useState(false)

  function atualizar(campo: keyof DocumentoContexto, value: string) {
    setValores((prev) => ({
      ...prev,
      [campo]: value,
    }))
  }

  async function handleSalvar() {
    setCarregando(true)
    try {
      await onSalvar(valores)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documente o contexto do problema, dados e insights relevantes e quais personas são
        impactadas por esta iniciativa.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Problema identificado</label>
          <Textarea
            value={valores.problema}
            onChange={(event) => atualizar('problema', event.target.value)}
            placeholder="Qual problema ou oportunidade deu origem a este documento?"
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Dados e evidências</label>
          <Textarea
            value={valores.dados}
            onChange={(event) => atualizar('dados', event.target.value)}
            placeholder="Quais dados, entrevistas ou evidências sustentam este documento?"
            className="min-h-[120px]"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Personas impactadas</label>
        <Input
          value={valores.personas}
          onChange={(event) => atualizar('personas', event.target.value)}
          placeholder="Ex.: Financeiro, Operações, Vendas B2B..."
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={carregando}>
          Salvar contexto
        </Button>
      </div>
    </div>
  )
}
