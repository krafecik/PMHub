'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { DocumentoComentario } from '@/types/documentacao'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, CheckCircle2 } from 'lucide-react'

interface ComentariosDocumentoProps {
  comentarios: DocumentoComentario[]
  onEnviar?: (texto: string) => Promise<void> | void
}

export function ComentariosDocumento({ comentarios, onEnviar }: ComentariosDocumentoProps) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleEnviar() {
    if (!texto.trim() || !onEnviar) return
    setEnviando(true)
    try {
      await onEnviar(texto.trim())
      setTexto('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <MessageCircle className="text-primary h-4 w-4" />
        <h3 className="text-base font-semibold text-text-primary">Comentários e aprovações</h3>
      </div>

      <div className="space-y-4 py-4">
        {comentarios.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            Nenhum comentário registrado.
          </div>
        ) : (
          <div className="space-y-3">
            {comentarios.map((comentario) => (
              <ComentarioItem key={comentario.id} comentario={comentario} />
            ))}
          </div>
        )}
      </div>

      {onEnviar && (
        <div className="space-y-2">
          <Textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Adicione um comentário ou solicitação de aprovação..."
            className="min-h-[120px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleEnviar} disabled={enviando || !texto.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              Enviar comentário
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ComentarioItem({ comentario }: { comentario: DocumentoComentario }) {
  return (
    <div className="space-y-2 rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs uppercase">
            {comentario.tipo}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {comentario.createdAt ? new Date(comentario.createdAt).toLocaleString() : 'Agora'}
          </span>
        </div>
        {comentario.resolvido && (
          <div className="flex items-center gap-1 text-xs text-emerald-500">
            <CheckCircle2 className="h-3 w-3" />
            Resolvido
          </div>
        )}
      </div>
      <p className="whitespace-pre-line text-sm text-text-primary">{comentario.texto}</p>
      {comentario.respostas && comentario.respostas.length > 0 && (
        <div className="space-y-2 border-l-2 border-border/60 pl-3">
          {comentario.respostas.map((resposta) => (
            <div
              key={resposta.id}
              className="rounded-md bg-muted/60 p-2 text-sm text-muted-foreground"
            >
              {resposta.texto}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
