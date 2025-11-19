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
import type { DocumentoCriterioAceite } from '@/types/documentacao'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import * as Dialog from '@radix-ui/react-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AiButton } from '@/components/ui/ai-button'
import { gerarCenariosGherkin } from '@/lib/documentacao-api'

interface SecaoCriteriosAceiteProps {
  criterios: DocumentoCriterioAceite[]
  onChange: (criterios: DocumentoCriterioAceite[]) => Promise<void> | void
  documentoId?: string
}

interface ModalCriterioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: DocumentoCriterioAceite
  onSubmit: (valor: DocumentoCriterioAceite) => void
}

function ModalCriterio({ open, onOpenChange, initialData, onSubmit }: ModalCriterioProps) {
  const [codigo, setCodigo] = useState(initialData?.codigo ?? '')
  const [descricao, setDescricao] = useState(initialData?.descricao ?? '')
  const [cenario, setCenario] = useState(initialData?.cenario ?? '')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      ...initialData,
      codigo,
      descricao,
      cenario,
    })
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar critério de aceite' : 'Adicionar critério de aceite'}
          </DialogTitle>
          <DialogDescription>
            Defina critérios claros e mensuráveis para validar a entrega. Utilize formato
            Given/When/Then quando necessário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Código</label>
              <Input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                placeholder="CA-01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <Textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Descreva o critério de aceite..."
              className="h-32"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Cenário (Given / When / Then)
            </label>
            <Textarea
              value={cenario}
              onChange={(event) => setCenario(event.target.value)}
              placeholder="Given..., When..., Then..."
              className="h-32"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">
              {initialData ? 'Salvar alterações' : 'Adicionar critério'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}

export function SecaoCriteriosAceite({
  criterios,
  onChange,
  documentoId,
}: SecaoCriteriosAceiteProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<DocumentoCriterioAceite>()
  const [carregando, setCarregando] = useState(false)

  function abrirNovo() {
    setEmEdicao(undefined)
    setModalAberto(true)
  }

  function editar(item: DocumentoCriterioAceite) {
    setEmEdicao(item)
    setModalAberto(true)
  }

  async function remover(index: number) {
    setCarregando(true)
    try {
      await onChange(criterios.filter((_, itemIndex) => itemIndex !== index))
    } finally {
      setCarregando(false)
    }
  }

  async function salvar(item: DocumentoCriterioAceite) {
    setCarregando(true)
    try {
      if (emEdicao) {
        await onChange(criterios.map((crit) => (crit === emEdicao ? { ...item } : crit)))
      } else {
        await onChange([...criterios, item])
      }
    } finally {
      setCarregando(false)
    }
  }

  async function handleGerarGherkin(result: any) {
    if (result?.cenarios && Array.isArray(result.cenarios)) {
      const novosCriterios: DocumentoCriterioAceite[] = result.cenarios.map((cenario: any) => ({
        codigo: `CA-${criterios.length + 1}`,
        descricao: cenario.titulo,
        cenario: cenario.steps?.join('\n') || '',
      }))
      await onChange([...criterios, ...novosCriterios])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Defina os critérios de aceite que validam o comportamento proposto. Utilize linguagem
          clara e verificável.
        </p>
        <div className="flex gap-2">
          {documentoId && (
            <AiButton
              onGenerate={() => gerarCenariosGherkin(documentoId)}
              onSuccess={handleGerarGherkin}
              label="Gerar Gherkin com IA"
            />
          )}
          <Button size="sm" onClick={abrirNovo} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar critério
          </Button>
        </div>
      </div>

      {criterios.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nenhum critério de aceite cadastrado até o momento.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Cenário</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {criterios.map((item, index) => (
              <TableRow key={`${item.codigo ?? index}`}>
                <TableCell>{item.codigo || `CA-${index + 1}`}</TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell>
                  {item.cenario || (
                    <span className="text-xs text-muted-foreground">Não informado</span>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" onClick={() => editar(item)}>
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

      <ModalCriterio
        open={modalAberto}
        onOpenChange={setModalAberto}
        initialData={emEdicao}
        onSubmit={salvar}
      />
    </div>
  )
}
