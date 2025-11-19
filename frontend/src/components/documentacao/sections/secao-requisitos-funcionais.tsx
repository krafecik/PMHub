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
import type { DocumentoRequisitoFuncional } from '@/types/documentacao'
import { ModalRequisitoFuncional } from '../modal-requisito-funcional'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SecaoRequisitosFuncionaisProps {
  requisitos: DocumentoRequisitoFuncional[]
  onChange: (requisitos: DocumentoRequisitoFuncional[]) => Promise<void> | void
}

export function SecaoRequisitosFuncionais({
  requisitos,
  onChange,
}: SecaoRequisitosFuncionaisProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<DocumentoRequisitoFuncional>()
  const [carregando, setCarregando] = useState(false)

  function abrirNovo() {
    setEmEdicao(undefined)
    setModalAberto(true)
  }

  function editar(requisito: DocumentoRequisitoFuncional) {
    setEmEdicao(requisito)
    setModalAberto(true)
  }

  async function remover(codigo: string) {
    setCarregando(true)
    try {
      await onChange(requisitos.filter((item) => item.codigo !== codigo))
    } finally {
      setCarregando(false)
    }
  }

  async function salvar(requisito: DocumentoRequisitoFuncional) {
    setCarregando(true)
    try {
      if (emEdicao) {
        await onChange(
          requisitos.map((item) => (item.codigo === emEdicao.codigo ? { ...requisito } : item)),
        )
      } else {
        await onChange([...requisitos, requisito])
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Liste as funcionalidades obrigatórias numeradas. Cada requisito deve ser claro, testável e
          vinculado ao objetivo.
        </p>
        <Button size="sm" onClick={abrirNovo} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar requisito
        </Button>
      </div>

      {requisitos.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nenhum requisito funcional cadastrado até o momento.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px]">Prioridade</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requisitos.map((item) => (
              <TableRow key={item.codigo}>
                <TableCell className="font-medium">{item.codigo}</TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell>
                  {item.prioridade ? (
                    <Badge variant="secondary" className="uppercase">
                      {item.prioridade}
                    </Badge>
                  ) : (
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
                    onClick={() => remover(item.codigo)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ModalRequisitoFuncional
        open={modalAberto}
        onOpenChange={setModalAberto}
        initialData={emEdicao}
        onSubmit={salvar}
      />
    </div>
  )
}
