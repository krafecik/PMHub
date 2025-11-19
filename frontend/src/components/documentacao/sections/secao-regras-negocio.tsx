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
import type { DocumentoRegraNegocio } from '@/types/documentacao'
import { ModalRegraNegocio } from '../modal-regra-negocio'
import { Badge } from '@/components/ui/badge'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AiButton } from '@/components/ui/ai-button'
import { sugerirRegrasNegocio } from '@/lib/documentacao-api'

interface SecaoRegrasNegocioProps {
  regras: DocumentoRegraNegocio[]
  onChange: (regras: DocumentoRegraNegocio[]) => Promise<void> | void
  documentoId?: string
}

export function SecaoRegrasNegocio({ regras, onChange, documentoId }: SecaoRegrasNegocioProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<DocumentoRegraNegocio>()
  const [carregando, setCarregando] = useState(false)

  function abrirNovaRegra() {
    setEmEdicao(undefined)
    setModalAberto(true)
  }

  function editarRegra(regra: DocumentoRegraNegocio) {
    setEmEdicao(regra)
    setModalAberto(true)
  }

  async function removerRegra(codigo: string) {
    setCarregando(true)
    try {
      await onChange(regras.filter((item) => item.codigo !== codigo))
    } finally {
      setCarregando(false)
    }
  }

  async function salvarRegra(regra: DocumentoRegraNegocio) {
    setCarregando(true)
    try {
      if (emEdicao) {
        await onChange(
          regras.map((item) => (item.codigo === emEdicao.codigo ? { ...regra } : item)),
        )
      } else {
        await onChange([...regras, regra])
      }
    } finally {
      setCarregando(false)
    }
  }

  async function handleSugerirRegras(result: any) {
    if (result?.regras && Array.isArray(result.regras)) {
      const novasRegras: DocumentoRegraNegocio[] = result.regras.map((regra: any) => ({
        codigo: regra.codigo,
        titulo: regra.descricao,
        descricao: regra.descricao,
        tipo: regra.tipo || 'FUNCIONAL',
        origem: 'IA',
        impacto: 'MEDIO',
      }))
      await onChange([...regras, ...novasRegras])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Registre as regras de negócio vinculadas a este documento. Use códigos padronizados e
          descreva impacto, tipo e origem.
        </p>
        <div className="flex gap-2">
          {documentoId && (
            <AiButton
              onGenerate={() => sugerirRegrasNegocio(documentoId)}
              onSuccess={handleSugerirRegras}
              label="Sugerir com IA"
            />
          )}
          <Button size="sm" onClick={abrirNovaRegra} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar regra
          </Button>
        </div>
      </div>

      {regras.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nenhuma regra de negócio cadastrada até o momento.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Impacto</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {regras.map((regra) => (
              <TableRow key={regra.codigo}>
                <TableCell className="font-medium">{regra.codigo}</TableCell>
                <TableCell>
                  <div className="font-medium text-text-primary">{regra.titulo}</div>
                  {regra.descricao && (
                    <div className="text-xs text-muted-foreground">{regra.descricao}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="uppercase">
                    {regra.tipo}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase">
                    {regra.origem}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase">
                    {regra.impacto}
                  </Badge>
                </TableCell>
                <TableCell>
                  {regra.modulo || (
                    <span className="text-xs text-muted-foreground">Não informado</span>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" onClick={() => editarRegra(regra)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={carregando}
                    onClick={() => removerRegra(regra.codigo)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ModalRegraNegocio
        open={modalAberto}
        onOpenChange={setModalAberto}
        initialData={emEdicao}
        onSubmit={salvarRegra}
      />
    </div>
  )
}
