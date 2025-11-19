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
import type { DocumentoRequisitoNaoFuncional } from '@/types/documentacao'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import * as Dialog from '@radix-ui/react-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Plus, Trash2 } from 'lucide-react'

interface SecaoRequisitosNaoFuncionaisProps {
  requisitos: DocumentoRequisitoNaoFuncional[]
  onChange: (requisitos: DocumentoRequisitoNaoFuncional[]) => Promise<void> | void
}

interface FormularioRequisitoNaoFuncionalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: DocumentoRequisitoNaoFuncional
  onSubmit: (value: DocumentoRequisitoNaoFuncional) => void
}

function FormularioRequisitoNaoFuncional({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: FormularioRequisitoNaoFuncionalProps) {
  const [categoria, setCategoria] = useState(initialData?.categoria ?? '')
  const [descricao, setDescricao] = useState(initialData?.descricao ?? '')
  const [metrica, setMetrica] = useState(initialData?.metrica ?? '')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      ...initialData,
      categoria,
      descricao,
      metrica,
    })
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar requisito não funcional' : 'Adicionar requisito não funcional'}
          </DialogTitle>
          <DialogDescription>
            Defina os requisitos não funcionais como performance, segurança, disponibilidade ou
            conformidade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Categoria</label>
            <Input
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              placeholder="Ex.: Segurança, Performance, Auditoria..."
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <Textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Explique a necessidade não funcional com detalhes..."
              required
              className="h-28"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Métrica / SLA</label>
            <Input
              value={metrica}
              onChange={(event) => setMetrica(event.target.value)}
              placeholder="Ex.: 99,9% uptime, 200ms de resposta, SOC2 compliant..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit">
              {initialData ? 'Salvar alterações' : 'Adicionar requisito'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}

export function SecaoRequisitosNaoFuncionais({
  requisitos,
  onChange,
}: SecaoRequisitosNaoFuncionaisProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<DocumentoRequisitoNaoFuncional>()
  const [carregando, setCarregando] = useState(false)

  function abrirNovo() {
    setEmEdicao(undefined)
    setModalAberto(true)
  }

  function editar(item: DocumentoRequisitoNaoFuncional) {
    setEmEdicao(item)
    setModalAberto(true)
  }

  async function remover(categoria: string) {
    setCarregando(true)
    try {
      await onChange(requisitos.filter((item) => item.categoria !== categoria))
    } finally {
      setCarregando(false)
    }
  }

  async function salvar(item: DocumentoRequisitoNaoFuncional) {
    setCarregando(true)
    try {
      if (emEdicao) {
        await onChange(
          requisitos.map((req) => (req.categoria === emEdicao.categoria ? { ...item } : req)),
        )
      } else {
        await onChange([...requisitos, item])
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Registre os requisitos não funcionais essenciais, como disponibilidade, conformidade,
          auditoria ou performance.
        </p>
        <Button size="sm" onClick={abrirNovo} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar requisito
        </Button>
      </div>

      {requisitos.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nenhum requisito não funcional cadastrado até o momento.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Métrica / SLA</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requisitos.map((item) => (
              <TableRow key={item.categoria}>
                <TableCell className="font-medium">{item.categoria}</TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell>
                  {item.metrica || (
                    <span className="text-xs text-muted-foreground">Não definido</span>
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
                    onClick={() => remover(item.categoria)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <FormularioRequisitoNaoFuncional
        open={modalAberto}
        onOpenChange={setModalAberto}
        initialData={emEdicao}
        onSubmit={salvar}
      />
    </div>
  )
}
