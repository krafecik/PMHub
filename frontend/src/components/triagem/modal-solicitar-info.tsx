'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import {
  X,
  Info,
  User,
  MessageSquare,
  Send,
  AlertCircle,
  FileText,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { solicitarInformacao } from '@/lib/triagem-api'

const solicitarInfoSchema = z.object({
  solicitanteId: z.string().min(1, 'Selecione o destinatário'),
  texto: z.string().min(10, 'A solicitação deve ter no mínimo 10 caracteres'),
  prazo: z.string().optional(),
})

type SolicitarInfoFormValues = z.infer<typeof solicitarInfoSchema>

interface ModalSolicitarInfoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandaId: string
  demandaTitulo: string
  reportadoPor?: {
    id: string
    nome: string
    email: string
  }
}

// Templates de perguntas comuns
const templatePerguntas = [
  {
    categoria: 'Esclarecimento',
    perguntas: [
      'Você pode fornecer mais detalhes sobre o problema específico?',
      'Qual é o comportamento esperado versus o comportamento atual?',
      'Em que contexto/cenário esse problema ocorre?',
    ],
  },
  {
    categoria: 'Evidências',
    perguntas: [
      'Você pode anexar prints ou vídeos demonstrando o problema?',
      'Existe um passo-a-passo para reproduzir a situação?',
      'Quantos usuários/clientes estão sendo impactados?',
    ],
  },
  {
    categoria: 'Impacto',
    perguntas: [
      'Qual é o impacto financeiro ou operacional deste problema?',
      'Existe alguma solução alternativa (workaround) sendo utilizada?',
      'Qual é a urgência para resolver esta questão?',
    ],
  },
  {
    categoria: 'Técnico',
    perguntas: [
      'Em qual versão do sistema o problema foi identificado?',
      'Existe alguma mensagem de erro específica?',
      'O problema ocorre em todos os ambientes ou apenas em produção?',
    ],
  },
]

const messageTemplates = [
  {
    id: 'detalhamento-completo',
    titulo: 'Solicitação de detalhamento completo',
    descricao: 'Pede descrição clara, passos de reprodução e impacto.',
    corpo: `Olá, tudo bem?

Para conseguirmos priorizar corretamente, você pode detalhar um pouco mais esta demanda?

- Descreva o comportamento atual e o comportamento esperado
- Informe os passos para reproduzir o cenário
- Cite clientes/segmentos afetados e a frequência do problema
- Compartilhe prints, vídeos ou logs se possível

Obrigado!`,
  },
  {
    id: 'impacto-urgencia',
    titulo: 'Impacto e urgência',
    descricao: 'Foca em entender gravidade e prazo.',
    corpo: `Oi!

Preciso de alguns dados para enquadrar esta demanda:

- Qual o impacto (financeiro, operacional ou experiência) caso não resolvamos?
- Existe workaround em uso? Quanto esforço têm consumido?
- Há algum prazo crítico (legislação, cliente, evento)?

Com essas informações conseguimos priorizar melhor. Obrigado!`,
  },
  {
    id: 'validacao-negocio',
    titulo: 'Confirmação com negócio',
    descricao: 'Confirma prioridade com stakeholder.',
    corpo: `Olá!

Antes de avançarmos, poderia confirmar:

- Quem é o responsável do lado do negócio por aprovar esta iniciativa?
- Há métricas-alvo ou resultados esperados?
- Esta demanda está alinhada com o planejamento atual do produto?

Essas respostas nos ajudam a direcionar o próximo passo. Obrigado!`,
  },
]

export function ModalSolicitarInfo({
  open,
  onOpenChange,
  demandaId,
  demandaTitulo,
  reportadoPor,
}: ModalSolicitarInfoProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedPergunta, setSelectedPergunta] = React.useState<string | null>(null)
  const [selectedMensagem, setSelectedMensagem] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SolicitarInfoFormValues>({
    resolver: zodResolver(solicitarInfoSchema),
    defaultValues: {
      solicitanteId: reportadoPor?.id || '',
      texto: '',
      prazo: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 3 dias
    },
  })

  const texto = watch('texto')

  // Mutation para solicitar informação
  const { mutate: solicitar, isPending } = useMutation({
    mutationFn: (values: SolicitarInfoFormValues) =>
      solicitarInformacao(demandaId, {
        solicitanteId: values.solicitanteId,
        texto: values.texto,
        prazo: values.prazo ? new Date(values.prazo).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triagem'] })
      toast({
        title: 'Solicitação enviada com sucesso!',
        description: 'O solicitante foi notificado e tem até o prazo estabelecido para responder.',
      })
      reset()
      setSelectedPergunta(null)
      setSelectedMensagem(null)
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message || 'Ocorreu um erro ao processar a solicitação.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = handleSubmit((values) => {
    solicitar(values)
  })

  const handleTemplateSelect = (pergunta: string) => {
    const textoAtual = texto || ''
    const novaPergunta = textoAtual ? `${textoAtual}\n\n${pergunta}` : pergunta
    setValue('texto', novaPergunta)
    setSelectedPergunta(pergunta)
    setSelectedMensagem(null)
  }

  const handleMessageTemplateSelect = (templateId: string, corpo: string) => {
    setValue('texto', corpo)
    setSelectedMensagem(templateId)
    setSelectedPergunta(null)
  }

  React.useEffect(() => {
    if (reportadoPor?.id) {
      setValue('solicitanteId', reportadoPor.id)
    }
  }, [reportadoPor, setValue])

  React.useEffect(() => {
    if (!open) {
      setSelectedPergunta(null)
      setSelectedMensagem(null)
    }
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="h-[85vh] max-h-[700px] w-full max-w-3xl"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                >
                  <form
                    onSubmit={onSubmit}
                    className="flex h-full flex-col rounded-lg border border-border bg-background shadow-xl"
                  >
                    {/* Header */}
                    <div className="border-b p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100">
                            <Info className="h-5 w-5 text-secondary-600" />
                          </div>
                          <div>
                            <Dialog.Title className="text-xl font-semibold text-text-primary">
                              Solicitar Informações
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-text-secondary">
                              Demanda #{demandaId} - {demandaTitulo}
                            </Dialog.Description>
                          </div>
                        </div>
                        <Dialog.Close asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Fechar modal de solicitação de informações"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      <Tabs defaultValue="compose" className="h-full">
                        <div className="px-6 pt-4">
                          <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="compose">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Compor
                            </TabsTrigger>
                            <TabsTrigger value="templates">
                              <FileText className="mr-2 h-4 w-4" />
                              Templates
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="compose" className="h-[calc(100%-4rem)] px-6 pb-6 pt-4">
                          <div className="flex h-full flex-col space-y-4">
                            {/* Destinatário */}
                            <div>
                              <Label htmlFor="solicitante">Destinatário *</Label>
                              <div className="mt-1">
                                {reportadoPor ? (
                                  <Card variant="outline" className="bg-secondary-50 p-3">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-text-muted" />
                                      <div>
                                        <p className="text-sm font-medium">{reportadoPor.nome}</p>
                                        <p className="text-xs text-text-muted">
                                          {reportadoPor.email}
                                        </p>
                                      </div>
                                    </div>
                                  </Card>
                                ) : (
                                  <Input
                                    id="solicitante"
                                    placeholder="ID do solicitante"
                                    error={!!errors.solicitanteId}
                                    {...register('solicitanteId')}
                                  />
                                )}
                                {errors.solicitanteId && (
                                  <p className="text-error-DEFAULT mt-1 text-xs">
                                    {errors.solicitanteId.message}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Prazo */}
                            <div>
                              <Label htmlFor="prazo">Prazo para resposta</Label>
                              <Input
                                id="prazo"
                                type="date"
                                min={format(new Date(), 'yyyy-MM-dd')}
                                {...register('prazo')}
                              />
                            </div>

                            {/* Texto da solicitação */}
                            <div className="flex flex-1 flex-col">
                              <Label htmlFor="texto">Solicitação *</Label>
                              <Textarea
                                id="texto"
                                placeholder="Digite sua solicitação de informações..."
                                className="mt-1 flex-1"
                                error={!!errors.texto}
                                {...register('texto')}
                              />
                              {errors.texto && (
                                <p className="text-error-DEFAULT mt-1 text-xs">
                                  {errors.texto.message}
                                </p>
                              )}
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-text-muted">
                                  {texto?.length || 0} caracteres
                                </span>
                                {selectedMensagem && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Mensagem aplicada
                                  </Badge>
                                )}
                                {!selectedMensagem && selectedPergunta && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Pergunta adicionada
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent
                          value="templates"
                          className="h-[calc(100%-4rem)] overflow-y-auto px-6 pb-6 pt-4"
                        >
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-text-primary">
                                Modelos rápidos
                              </h4>
                              <div className="grid gap-2 md:grid-cols-2">
                                {messageTemplates.map((template) => (
                                  <Card
                                    key={template.id}
                                    variant="outline"
                                    className={cn(
                                      'cursor-pointer p-3 transition-all hover:bg-secondary-50',
                                      selectedMensagem === template.id &&
                                        'bg-primary-50 ring-2 ring-primary-200',
                                    )}
                                    onClick={() =>
                                      handleMessageTemplateSelect(template.id, template.corpo)
                                    }
                                  >
                                    <p className="text-sm font-medium text-text-primary">
                                      {template.titulo}
                                    </p>
                                    <p className="text-xs text-text-muted">{template.descricao}</p>
                                  </Card>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="mb-2 mt-6 text-sm font-semibold text-text-primary">
                                Perguntas sugeridas
                              </h4>
                              <p className="text-sm text-text-secondary">
                                Adicione rapidamente perguntas frequentes ao corpo da solicitação.
                              </p>
                            </div>

                            {templatePerguntas.map((categoria) => (
                              <div key={categoria.categoria}>
                                <h4 className="mb-2 text-sm font-medium text-text-primary">
                                  {categoria.categoria}
                                </h4>
                                <div className="space-y-2">
                                  {categoria.perguntas.map((pergunta) => (
                                    <Card
                                      key={pergunta}
                                      variant="outline"
                                      className={cn(
                                        'cursor-pointer p-3 transition-all hover:bg-secondary-50',
                                        selectedPergunta === pergunta &&
                                          'bg-primary-50 ring-2 ring-primary-200',
                                      )}
                                      onClick={() => handleTemplateSelect(pergunta)}
                                    >
                                      <p className="text-sm">{pergunta}</p>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-background p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <AlertCircle className="h-4 w-4" />
                          <span>O solicitante receberá uma notificação por email</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            variant="gradient"
                            disabled={isPending}
                            loading={isPending}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Solicitação
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
