import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { evoluirParaEpico } from '@/lib/triagem-api'

// Função para remover tags HTML e obter apenas o texto
const stripHtml = (html: string): string => {
  if (!html) return ''
  // Remove tags HTML e espaços extras
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const schema = z.object({
  nomeEpico: z.string().min(3, 'Informe um nome para o épico'),
  objetivoEpico: z
    .string()
    .max(50000)
    .refine(
      (val) => stripHtml(val || '').trim().length >= 10,
      'Descreva o objetivo do épico com mais detalhes (mínimo 10 caracteres)',
    ),
  produtoId: z.string().min(1, 'Produto obrigatório'),
})

type FormValues = z.infer<typeof schema>

interface ModalVirarEpicoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demanda: {
    id: string
    titulo: string
    descricao?: string
    produtoId: string
    produtoNome: string
  } | null
  onCompleted?: () => void
}

export function ModalVirarEpico({
  open,
  onOpenChange,
  demanda,
  onCompleted,
}: ModalVirarEpicoProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeEpico: demanda?.titulo ?? '',
      objetivoEpico: demanda?.descricao ?? '',
      produtoId: demanda?.produtoId ?? '',
    },
  })

  const objetivoEpicoValue = watch('objetivoEpico')

  React.useEffect(() => {
    if (demanda) {
      reset({
        nomeEpico: demanda.titulo,
        objetivoEpico: demanda.descricao ?? '',
        produtoId: demanda.produtoId,
      })
    }
  }, [demanda, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!demanda) {
        throw new Error('Demanda não encontrada')
      }

      console.log('Chamando evoluirParaEpico com:', {
        demandaId: demanda.id,
        payload: {
          nomeEpico: values.nomeEpico,
          objetivoEpico: values.objetivoEpico,
          produtoId: values.produtoId,
        },
      })

      const result = await evoluirParaEpico(demanda.id, {
        nomeEpico: values.nomeEpico,
        objetivoEpico: values.objetivoEpico,
        produtoId: values.produtoId,
      })

      console.log('Resultado de evoluirParaEpico:', result)
      return result
    },
    onSuccess: (data) => {
      console.log('Sucesso ao evoluir para épico:', data)
      toast.success('Épico criado a partir da demanda.')
      onCompleted?.()
      onOpenChange(false)
      reset()
    },
    onError: (error: unknown) => {
      console.error('Erro completo ao evoluir demanda para épico:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Não foi possível evoluir a demanda para épico.'
      toast.error(errorMessage)
    },
  })

  if (!demanda) {
    return null
  }

  const onSubmit = handleSubmit(
    (values) => {
      console.log('Submetendo formulário:', values)
      mutate(values)
    },
    (errors) => {
      // Log de erros de validação para debug
      console.error('Erros de validação:', errors)
      if (errors.objetivoEpico) {
        toast.error(errors.objetivoEpico.message || 'Preencha o objetivo do épico corretamente')
      }
      if (errors.nomeEpico) {
        toast.error(errors.nomeEpico.message || 'Preencha o nome do épico corretamente')
      }
    },
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Evoluir demanda para épico</DialogTitle>
          <DialogDescription>
            Converta a demanda em um épico no pipeline de planejamento e registre as informações
            essenciais para o handoff.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            console.log('Form submit event triggered')
            onSubmit(e)
          }}
          className="space-y-6"
        >
          <Card variant="outline" className="p-4">
            <p className="text-sm text-muted-foreground">
              #{demanda.id} &mdash; {demanda.titulo}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Produto: <span className="font-medium text-text-primary">{demanda.produtoNome}</span>
            </p>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomeEpico">Nome do épico</Label>
              <Input id="nomeEpico" placeholder="Nome do épico" {...register('nomeEpico')} />
              {errors.nomeEpico && (
                <p className="text-error-DEFAULT text-xs">{errors.nomeEpico.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivoEpico">Objetivo do épico</Label>
              <RichTextEditor
                content={objetivoEpicoValue || ''}
                onChange={(content) => setValue('objetivoEpico', content, { shouldDirty: true })}
                placeholder="Descreva o objetivo, impacto esperado e hipóteses iniciais..."
                error={!!errors.objetivoEpico}
              />
              {errors.objetivoEpico && (
                <p className="text-error-DEFAULT text-xs">{errors.objetivoEpico.message}</p>
              )}
            </div>

            <input type="hidden" value={demanda.produtoId} {...register('produtoId')} />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isPending} disabled={isPending}>
              Confirmar evolução
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
