'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface SecaoObjetivoProps {
  valor?: string
  onSalvar: (valor?: string) => Promise<void> | void
}

export function SecaoObjetivo({ valor, onSalvar }: SecaoObjetivoProps) {
  const [objetivo, setObjetivo] = useState(valor ?? '')
  const [carregando, setCarregando] = useState(false)

  async function handleSalvar() {
    setCarregando(true)
    try {
      await onSalvar(objetivo)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Descreva o objetivo estratégico do documento. O foco deve estar no valor entregue e no
        problema resolvido.
      </p>
      <Textarea
        value={objetivo}
        onChange={(event) => setObjetivo(event.target.value)}
        placeholder="Explique claramente o que será entregue, o impacto esperado e como será medido o sucesso..."
        className="min-h-[180px]"
      />
      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={carregando}>
          Salvar objetivo
        </Button>
      </div>
    </div>
  )
}
