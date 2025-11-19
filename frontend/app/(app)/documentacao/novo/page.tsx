'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCriarDocumento } from '@/hooks/use-documentos'
import { useListarProdutos } from '@/hooks/use-produtos'
import { useListarUsuarios } from '@/hooks/use-usuarios'
import { toast } from 'sonner'
import { HelpButton } from '@/components/ui/help-button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  tipo: z.string().min(1, 'Selecione o tipo'),
  titulo: z.string().min(5, 'Informe um título significativo'),
  resumo: z.string().optional(),
  produtoId: z.string().optional(),
  pmId: z.string().optional(),
  squadId: z.string().optional(),
  objetivo: z.string().optional(),
  contextoProblema: z.string().optional(),
  contextoDados: z.string().optional(),
  contextoPersonas: z.string().optional(),
})

const TIPOS_DOCUMENTO = [
  { value: 'PRD', label: 'PRD – Product Requirements Document' },
  { value: 'BRD', label: 'BRD – Business Requirements Document' },
  { value: 'RFC', label: 'RFC – Request for Comments' },
  { value: 'SPEC', label: 'Specs técnicas e funcionais' },
  { value: 'RELEASE_NOTE', label: 'Release Notes' },
  { value: 'UX_DOC', label: 'Documentação de UX' },
]

type FormValues = z.infer<typeof schema>

const NO_SELECTION_VALUE = 'none'

const STEPS = [
  {
    id: 'tipo',
    titulo: 'Definir escopo do documento',
    descricao: 'Escolha o tipo de documento e confirme que ele representa corretamente o objetivo.',
    campos: ['tipo'],
  },
  {
    id: 'resumo',
    titulo: 'Título e resumo',
    descricao: 'Informe o título e um resumo executivo que contextualize o documento.',
    campos: ['titulo', 'resumo'],
  },
  {
    id: 'contexto',
    titulo: 'Contexto inicial',
    descricao:
      'Registre problema, dados e personas de forma resumida. Você poderá detalhar no editor.',
    campos: ['objetivo', 'contextoProblema', 'contextoDados', 'contextoPersonas'],
  },
  {
    id: 'responsaveis',
    titulo: 'Vínculos iniciais',
    descricao: 'Associe o documento a um produto, PM ou squad responsável.',
    campos: ['produtoId', 'pmId', 'squadId'],
  },
]

export default function NovoDocumentoPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const criarDocumento = useCriarDocumento()
  const { data: produtos } = useListarProdutos()
  const { data: usuarios } = useListarUsuarios()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: '',
      titulo: '',
      resumo: '',
      produtoId: NO_SELECTION_VALUE,
      pmId: NO_SELECTION_VALUE,
      squadId: '',
      objetivo: '',
      contextoProblema: '',
      contextoDados: '',
      contextoPersonas: '',
    },
  })

  function camposAtuais() {
    return STEPS[stepIndex].campos
  }

  async function handleAvancar() {
    const campos = camposAtuais() as (keyof FormValues)[]
    const valido = await form.trigger(campos)

    if (!valido) return

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1)
      return
    }

    try {
      const valores = form.getValues()
      const payload = {
        tipo: valores.tipo,
        titulo: valores.titulo,
        resumo: valores.resumo,
        produtoId:
          valores.produtoId && valores.produtoId !== NO_SELECTION_VALUE
            ? valores.produtoId
            : undefined,
        pmId: valores.pmId && valores.pmId !== NO_SELECTION_VALUE ? valores.pmId : undefined,
        squadId: valores.squadId || undefined,
        objetivo: valores.objetivo,
        contexto: {
          problema: valores.contextoProblema,
          dados: valores.contextoDados,
          personas: valores.contextoPersonas,
        },
      }

      const resultado = await criarDocumento.mutateAsync(payload)
      toast.success('Documento criado com sucesso!')
      router.push(`/documentacao/${resultado.id}`)
    } catch (error) {
      toast.error('Não foi possível criar o documento.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/documentacao')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Novo documento</h1>
            <p className="text-xs text-muted-foreground">
              Preencha os passos para iniciar um PRD estruturado.
            </p>
          </div>
        </div>
        <HelpButton
          title="Como criar um documento"
          content={
            <div className="space-y-3">
              <p>
                Defina o tipo correto, descreva o contexto inicial e vincule responsáveis antes de
                avançar para o detalhamento.
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Preencha o cabeçalho e o resumo para alinhar contexto com stakeholders.</li>
                <li>
                  Use as abas para registrar requisitos, regras de negócio, fluxos e critérios.
                </li>
                <li>Crie e compare versões para manter histórico claro até o handoff.</li>
              </ul>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="space-y-3 border border-border/60 bg-card/60 p-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                  index === stepIndex
                    ? 'border-primary text-primary'
                    : index < stepIndex
                      ? 'border-emerald-400 text-emerald-500'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {index < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{step.titulo}</div>
                <div className="text-xs text-muted-foreground">{step.descricao}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card className="border border-border/60 bg-card/60 p-6 shadow-sm">
          <Form {...form}>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              {stepIndex === 0 && (
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de documento</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {stepIndex === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="PRD - Autenticação v3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="resumo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resumo executivo</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explique brevemente o objetivo do documento..."
                            className="min-h-[160px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {stepIndex === 2 && (
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="objetivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo principal</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Qual problema será resolvido?"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contextoProblema"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Problema</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva o problema identificado..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contextoDados"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dados / Evidências</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Quais dados suportam este documento?"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="contextoPersonas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personas / Segmentos impactados</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Financeiro, Operações, Vendas, Onboarding..."
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {stepIndex === 3 && (
                <div className="grid gap-4 md:grid-cols-2">
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
                              <SelectValue placeholder="Selecione o PM" />
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
                        <FormLabel>Squad</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome ou identificador do squad" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            >
              Voltar etapa
            </Button>
            <Button type="button" onClick={handleAvancar} disabled={criarDocumento.isPending}>
              {stepIndex === STEPS.length - 1 ? 'Criar documento' : 'Próximo'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
