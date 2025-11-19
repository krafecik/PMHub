'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DocumentoRisco } from '@/types/documentacao'
import * as Dialog from '@radix-ui/react-dialog'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const PROBABILIDADES = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'BAIXA', label: 'Baixa' },
]

const IMPACTOS = [
  { value: 'ALTO', label: 'Alto' },
  { value: 'MEDIO', label: 'Médio' },
  { value: 'BAIXO', label: 'Baixo' },
]

interface SecaoRiscosProps {
  riscos: DocumentoRisco[]
  onChange: (riscos: DocumentoRisco[]) => Promise<void> | void
}

interface ModalRiscoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: DocumentoRisco
  onSubmit: (risk: DocumentoRisco) => void
}

function ModalRisco({ open, onOpenChange, initialData, onSubmit }: ModalRiscoProps) {
  const [descricao, setDescricao] = useState(initialData?.descricao ?? '')
  const [probabilidade, setProbabilidade] = useState(initialData?.probabilidade ?? 'MEDIA')
  const [impacto, setImpacto] = useState(initialData?.impacto ?? 'MEDIO')
  const [mitigacao, setMitigacao] = useState(initialData?.mitigacao ?? '')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      ...initialData,
      descricao,
      probabilidade,
      impacto,
      mitigacao,
    })
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar risco' : 'Adicionar risco'}</DialogTitle>
          <DialogDescription>
            Mapeie riscos técnicos, operacionais ou de negócio e registre planos de mitigação
            claros.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Descrição do risco</label>
            <Textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Descreva o risco identificado..."
              className="h-28"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Probabilidade</label>
              <Select value={probabilidade} onValueChange={setProbabilidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PROBABILIDADES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Impacto</label>
              <Select value={impacto} onValueChange={setImpacto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {IMPACTOS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Plano de mitigação</label>
            <Input
              value={mitigacao}
              onChange={(event) => setMitigacao(event.target.value)}
              placeholder="Como mitigaremos esse risco?"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">{initialData ? 'Salvar alterações' : 'Adicionar risco'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}

export function SecaoRiscos({ riscos, onChange }: SecaoRiscosProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<DocumentoRisco>()
  const [carregando, setCarregando] = useState(false)

  function abrirNovo() {
    setEmEdicao(undefined)
    setModalAberto(true)
  }

  function editar(risco: DocumentoRisco) {
    setEmEdicao(risco)
    setModalAberto(true)
  }

  async function remover(index: number) {
    setCarregando(true)
    try {
      await onChange(riscos.filter((_, itemIndex) => itemIndex !== index))
    } finally {
      setCarregando(false)
    }
  }

  async function salvar(risco: DocumentoRisco) {
    setCarregando(true)
    try {
      if (emEdicao) {
        await onChange(riscos.map((item) => (item === emEdicao ? { ...risco } : item)))
      } else {
        await onChange([...riscos, risco])
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Avalie riscos técnicos, operacionais ou de negócio e defina probabilidades, impactos e
          planos de mitigação.
        </p>
        <Button size="sm" onClick={abrirNovo} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar risco
        </Button>
      </div>

      {riscos.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nenhum risco registrado até o momento.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Probabilidade</TableHead>
              <TableHead>Impacto</TableHead>
              <TableHead>Mitigação</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {riscos.map((risco, index) => (
              <TableRow key={`${risco.descricao}-${index}`}>
                <TableCell className="max-w-[320px]">{risco.descricao}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="uppercase">
                    {risco.probabilidade}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase">
                    {risco.impacto}
                  </Badge>
                </TableCell>
                <TableCell>
                  {risco.mitigacao || (
                    <span className="text-xs text-muted-foreground">Não definido</span>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" onClick={() => editar(risco)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={carregando}
                    onClick={() => remover(index)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ModalRisco
        open={modalAberto}
        onOpenChange={setModalAberto}
        initialData={emEdicao}
        onSubmit={salvar}
      />
    </div>
  )
}
