'use client'

import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SecaoObjetivo } from './sections/secao-objetivo'
import { SecaoContexto } from './sections/secao-contexto'
import { SecaoRequisitosFuncionais } from './sections/secao-requisitos-funcionais'
import { SecaoRegrasNegocio } from './sections/secao-regras-negocio'
import { SecaoRequisitosNaoFuncionais } from './sections/secao-requisitos-nao-funcionais'
import { SecaoFluxos } from './sections/secao-fluxos'
import { SecaoCriteriosAceite } from './sections/secao-criterios-aceite'
import { SecaoRiscos } from './sections/secao-riscos'
import type {
  Documento,
  DocumentoCriterioAceite,
  DocumentoFluxo,
  DocumentoListItem,
  DocumentoRegraNegocio,
  DocumentoRequisitoFuncional,
  DocumentoRequisitoNaoFuncional,
  DocumentoRisco,
} from '@/types/documentacao'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useListarProdutos } from '@/hooks/use-produtos'
import { useListarUsuarios } from '@/hooks/use-usuarios'
import {
  type CreateDocumentoVersaoPayload,
  type UpdateDocumentoCabecalhoPayload,
  type UpdateDocumentoSecoesPayload,
} from '@/lib/documentacao-api'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import * as Dialog from '@radix-ui/react-dialog'
import { RefreshCcw } from 'lucide-react'

const TIPOS_DOCUMENTO = [
  { value: 'PRD', label: 'PRD' },
  { value: 'BRD', label: 'BRD' },
  { value: 'RFC', label: 'RFC' },
  { value: 'SPEC', label: 'Specs' },
  { value: 'RELEASE_NOTE', label: 'Release Notes' },
  { value: 'UX_DOC', label: 'UX Doc' },
]

const STATUS_DOCUMENTO = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'REVISAO', label: 'Em revisão' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'OBSOLETO', label: 'Obsoleto' },
]

const cabecalhoSchema = z.object({
  titulo: z.string().min(3, 'Título obrigatório'),
  resumo: z.string().optional(),
  tipo: z.string().min(1),
  status: z.string().min(1),
  produtoId: z.string().optional(),
  pmId: z.string().optional(),
  squadId: z.string().optional(),
})

interface EditorPrdProps {
  documento: DocumentoListItem
  onAtualizarCabecalho: (payload: UpdateDocumentoCabecalhoPayload) => Promise<void>
  onAtualizarSecoes: (payload: UpdateDocumentoSecoesPayload) => Promise<void>
  onCriarNovaVersao: (payload: CreateDocumentoVersaoPayload) => Promise<void>
}

export function EditorPrd({
  documento,
  onAtualizarCabecalho,
  onAtualizarSecoes,
  onCriarNovaVersao,
}: EditorPrdProps) {
  const [abaAtiva, setAbaAtiva] = useState('objetivo')
  const versaoAtual = useMemo(() => documento.versaoAtual ?? documento.versoes?.[0], [documento])
  const [modalNovaVersaoAberto, setModalNovaVersaoAberto] = useState(false)

  if (!versaoAtual) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Documento ainda não possui versão registrada.
      </div>
    )
  }

  async function atualizarSecao(partial: UpdateDocumentoSecoesPayload) {
    await onAtualizarSecoes(partial)
  }

  return (
    <div className="space-y-8">
      <CabecalhoDocumento
        documento={documento}
        onSalvar={onAtualizarCabecalho}
        onCriarNovaVersao={() => setModalNovaVersaoAberto(true)}
      />

      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Versão atual</span>
            <div className="flex items-center gap-3">
              <Badge variant="outline">v{versaoAtual.versao}</Badge>
              {versaoAtual.changelogResumo && (
                <span className="text-xs text-muted-foreground">
                  Changelog: {versaoAtual.changelogResumo}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setModalNovaVersaoAberto(true)}
          >
            <RefreshCcw className="h-4 w-4" />
            Nova versão
          </Button>
        </div>

        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="mt-4">
          <TabsList className="flex flex-wrap justify-start gap-2">
            <TabsTrigger value="objetivo">Objetivo</TabsTrigger>
            <TabsTrigger value="contexto">Contexto</TabsTrigger>
            <TabsTrigger value="funcionais">Requisitos Funcionais</TabsTrigger>
            <TabsTrigger value="regras">Regras de Negócio</TabsTrigger>
            <TabsTrigger value="nao-funcionais">Requisitos Não Funcionais</TabsTrigger>
            <TabsTrigger value="fluxos">Fluxos</TabsTrigger>
            <TabsTrigger value="criterios">Critérios de Aceite</TabsTrigger>
            <TabsTrigger value="riscos">Riscos</TabsTrigger>
          </TabsList>

          <TabsContent value="objetivo">
            <SecaoObjetivo
              valor={versaoAtual.objetivo}
              onSalvar={(valor) => atualizarSecao({ objetivo: valor })}
            />
          </TabsContent>

          <TabsContent value="contexto">
            <SecaoContexto
              contexto={versaoAtual.contexto}
              onSalvar={(contexto) => atualizarSecao({ contexto })}
            />
          </TabsContent>

          <TabsContent value="funcionais">
            <SecaoRequisitosFuncionais
              requisitos={versaoAtual.requisitosFuncionais ?? []}
              onChange={(lista: DocumentoRequisitoFuncional[]) =>
                atualizarSecao({ requisitosFuncionais: lista })
              }
            />
          </TabsContent>

          <TabsContent value="regras">
            <SecaoRegrasNegocio
              regras={versaoAtual.regrasNegocio ?? []}
              onChange={(lista: DocumentoRegraNegocio[]) =>
                atualizarSecao({ regrasNegocio: lista })
              }
              documentoId={documento.id}
            />
          </TabsContent>

          <TabsContent value="nao-funcionais">
            <SecaoRequisitosNaoFuncionais
              requisitos={versaoAtual.requisitosNaoFuncionais ?? []}
              onChange={(lista: DocumentoRequisitoNaoFuncional[]) =>
                atualizarSecao({ requisitosNaoFuncionais: lista })
              }
            />
          </TabsContent>

          <TabsContent value="fluxos">
            <SecaoFluxos
              fluxos={versaoAtual.fluxos}
              onSalvar={(fluxo: DocumentoFluxo) => atualizarSecao({ fluxos: fluxo })}
            />
          </TabsContent>

          <TabsContent value="criterios">
            <SecaoCriteriosAceite
              criterios={versaoAtual.criteriosAceite ?? []}
              onChange={(lista: DocumentoCriterioAceite[]) =>
                atualizarSecao({ criteriosAceite: lista })
              }
              documentoId={documento.id}
            />
          </TabsContent>

          <TabsContent value="riscos">
            <SecaoRiscos
              riscos={versaoAtual.riscos ?? []}
              onChange={(lista: DocumentoRisco[]) => atualizarSecao({ riscos: lista })}
            />
          </TabsContent>
        </Tabs>
      </div>

      <NovaVersaoDialog
        open={modalNovaVersaoAberto}
        onOpenChange={setModalNovaVersaoAberto}
        versaoAtual={versaoAtual.versao}
        onSubmit={onCriarNovaVersao}
      />
    </div>
  )
}

interface CabecalhoDocumentoProps {
  documento: Documento
  onSalvar: (payload: UpdateDocumentoCabecalhoPayload) => Promise<void>
  onCriarNovaVersao: () => void
}

const NO_SELECTION_VALUE = 'none'

function CabecalhoDocumento({ documento, onSalvar, onCriarNovaVersao }: CabecalhoDocumentoProps) {
  const form = useForm<z.infer<typeof cabecalhoSchema>>({
    resolver: zodResolver(cabecalhoSchema),
    defaultValues: {
      titulo: documento.titulo,
      resumo: documento.resumo,
      tipo: documento.tipo,
      status: documento.status,
      produtoId: documento.produtoId ?? NO_SELECTION_VALUE,
      pmId: documento.pmId ?? NO_SELECTION_VALUE,
      squadId: documento.squadId ?? '',
    },
  })

  const { data: produtos } = useListarProdutos()
  const { data: usuarios } = useListarUsuarios()
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar(values: z.infer<typeof cabecalhoSchema>) {
    setSalvando(true)
    try {
      await onSalvar({
        titulo: values.titulo,
        resumo: values.resumo,
        tipo: values.tipo,
        status: values.status,
        produtoId:
          values.produtoId && values.produtoId !== NO_SELECTION_VALUE
            ? values.produtoId
            : undefined,
        pmId: values.pmId && values.pmId !== NO_SELECTION_VALUE ? values.pmId : undefined,
        squadId: values.squadId || undefined,
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-6 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSalvar)} className="space-y-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cabeçalho
            </span>
            <h2 className="text-2xl font-semibold text-text-primary">
              Informações gerais do documento
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="PRD - Autenticação v3" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_DOCUMENTO.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="produtoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_SELECTION_VALUE}>Não vinculado</SelectItem>
                      {(produtos ?? []).map((produto) => (
                        <SelectItem key={produto.id} value={produto.id.toString()}>
                          {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pmId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PM responsável</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_SELECTION_VALUE}>Não definido</SelectItem>
                      {(usuarios ?? []).map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.name} ({usuario.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="squadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Squad / Time</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome ou identificador do squad" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="resumo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumo executivo</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Resumo executivo sobre o objetivo do documento, público alvo e métricas principais..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Última atualização{' '}
              {documento.updatedAt ? new Date(documento.updatedAt).toLocaleString() : 'recente'}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onCriarNovaVersao}>
                Nova versão
              </Button>
              <Button type="submit" disabled={salvando}>
                Salvar alterações
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

interface NovaVersaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  versaoAtual: string
  onSubmit: (payload: CreateDocumentoVersaoPayload) => Promise<void>
}

function NovaVersaoDialog({ open, onOpenChange, versaoAtual, onSubmit }: NovaVersaoDialogProps) {
  const [versao, setVersao] = useState(incrementarVersao(versaoAtual))
  const [changelog, setChangelog] = useState('')
  const [salvando, setSalvando] = useState(false)

  function handleOpenChange(novoEstado: boolean) {
    onOpenChange(novoEstado)
    if (novoEstado) {
      setVersao(incrementarVersao(versaoAtual))
      setChangelog('')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    try {
      await onSubmit({
        versao,
        changelogResumo: changelog,
      })
      onOpenChange(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar nova versão</DialogTitle>
          <DialogDescription>
            Inicie uma nova versão preservando as informações atuais. Utilize o changelog para
            descrever as mudanças planejadas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Versão</FormLabel>
            <Input
              value={versao}
              onChange={(event) => setVersao(event.target.value)}
              placeholder="Ex.: 1.2"
              required
            />
          </div>
          <div className="space-y-2">
            <FormLabel>Resumo do changelog</FormLabel>
            <Textarea
              value={changelog}
              onChange={(event) => setChangelog(event.target.value)}
              placeholder="Descreva brevemente o que mudará nesta versão..."
              className="min-h-[120px]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={salvando}>
              Criar versão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog.Root>
  )
}

function incrementarVersao(versao: string): string {
  const partes = versao.split('.').map((part) => Number(part) || 0)
  if (partes.length === 0) return '1.0'
  const ultimaPosicao = partes.length - 1
  partes[ultimaPosicao] = partes[ultimaPosicao] + 1
  return partes.join('.')
}
