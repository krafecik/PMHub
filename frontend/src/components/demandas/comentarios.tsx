'use client'

import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { listarComentarios, adicionarComentario } from '@/lib/demandas-api'
import { formatRelativeDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ComentariosProps {
  demandaId: string
}

export function Comentarios({ demandaId }: ComentariosProps) {
  const [novoComentario, setNovoComentario] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: comentarios, isLoading } = useQuery({
    queryKey: ['comentarios', demandaId],
    queryFn: () => listarComentarios(demandaId),
  })

  const { mutate: enviarComentario, isPending } = useMutation({
    mutationFn: (texto: string) => adicionarComentario(demandaId, texto),
    onSuccess: () => {
      setNovoComentario('')
      queryClient.invalidateQueries({ queryKey: ['comentarios', demandaId] })
      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi adicionado com sucesso.',
      })
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar o comentário.'
      toast({
        title: 'Erro ao adicionar comentário',
        description: message,
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = () => {
    const texto = novoComentario.trim()
    if (texto) {
      enviarComentario(texto)
    }
  }

  return (
    <div className="space-y-4">
      {/* Lista de comentários */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="text-sm text-text-muted">Carregando comentários...</p>
            </div>
          </div>
        ) : comentarios && comentarios.length > 0 ? (
          comentarios.map((comentario) => (
            <div key={comentario.id} className="space-y-2 rounded-lg bg-secondary-50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="font-medium">
                    {comentario.usuarioNome || `Usuário #${comentario.usuarioId}`}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeDate(comentario.createdAt)}</span>
                  </div>
                  {comentario.foiEditado && (
                    <>
                      <span>•</span>
                      <span className="text-xs italic">editado</span>
                    </>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-text-primary">{comentario.texto}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          </div>
        )}
      </div>

      {/* Formulário para novo comentário */}
      <div className="space-y-3 border-t pt-4">
        <Textarea
          placeholder="Adicione um comentário..."
          value={novoComentario}
          onChange={(e) => setNovoComentario(e.target.value)}
          rows={3}
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!novoComentario.trim() || isPending}
            loading={isPending}
            onClick={handleSubmit}
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar comentário
          </Button>
        </div>
      </div>
    </div>
  )
}
