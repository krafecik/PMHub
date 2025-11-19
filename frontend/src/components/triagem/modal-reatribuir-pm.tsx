'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { reatribuirPm } from '@/lib/triagem-api'
import { toast } from 'sonner'
import { useListarUsuarios } from '@/hooks/use-usuarios'

interface ModalReatribuirPmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandaId?: string
  demandaTitulo?: string
  onSuccess?: () => void
}

export function ModalReatribuirPm({
  open,
  onOpenChange,
  demandaId,
  demandaTitulo,
  onSuccess,
}: ModalReatribuirPmProps) {
  const [novoPmId, setNovoPmId] = React.useState('')
  const { data: usuarios, isLoading: usuariosLoading } = useListarUsuarios()

  // Filtrar apenas PMs e CPOs
  const pmsDisponiveis = React.useMemo(() => {
    if (!usuarios) return []
    return usuarios.filter((usuario) => usuario.role === 'PM' || usuario.role === 'CPO')
  }, [usuarios])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!demandaId || !novoPmId) {
        throw new Error('Demanda ID e PM ID são obrigatórios')
      }
      return await reatribuirPm(demandaId, novoPmId)
    },
    onSuccess: async () => {
      toast.success('Responsável reatribuído com sucesso.')
      setNovoPmId('')

      // Chamar onSuccess antes de fechar o modal
      if (onSuccess) {
        await onSuccess()
      }

      // Fechar modal após um pequeno delay para garantir que o toast apareça
      setTimeout(() => {
        onOpenChange(false)
      }, 200)
    },
    onError: (error: unknown) => {
      console.error('Erro ao reatribuir PM:', error)
      const message = error instanceof Error ? error.message : 'Não foi possível reatribuir.'
      toast.error(message)
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!demandaId) {
      toast.error('ID da demanda não encontrado.')
      return
    }
    if (!novoPmId) {
      toast.error('Selecione o novo PM responsável.')
      return
    }
    mutation.mutate()
  }

  const disabled = mutation.isPending || usuariosLoading || !demandaId

  React.useEffect(() => {
    if (!open) {
      setNovoPmId('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reatribuir PM responsável</DialogTitle>
          <DialogDescription>
            Escolha o novo PM responsável pela demanda{' '}
            <span className="text-foreground font-medium">#{demandaId}</span>{' '}
            {demandaTitulo ? `(${demandaTitulo})` : ''}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="novoPmId">PM Responsável</Label>
            <Select
              value={novoPmId || undefined}
              onValueChange={setNovoPmId}
              disabled={disabled || usuariosLoading}
            >
              <SelectTrigger id="novoPmId">
                <SelectValue placeholder="Selecione o PM responsável" />
              </SelectTrigger>
              <SelectContent>
                {pmsDisponiveis.length === 0 ? (
                  <SelectItem value="no-users" disabled>
                    {usuariosLoading ? 'Carregando...' : 'Nenhum PM disponível'}
                  </SelectItem>
                ) : (
                  pmsDisponiveis.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.name} {usuario.email && `(${usuario.email})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecione o novo PM responsável pela demanda.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={disabled} loading={mutation.isPending}>
              Confirmar Reatribuição
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
