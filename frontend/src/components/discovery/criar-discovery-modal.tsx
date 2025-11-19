'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Plus, AlertCircle } from 'lucide-react'
import { useCriarDiscovery } from '@/hooks/use-discovery'
import { useListarDemandas } from '@/hooks/use-demandas'
import { useListarProdutos } from '@/hooks/use-produtos'
import { useListarUsuarios } from '@/hooks/use-usuarios'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import type { CatalogItem } from '@/lib/catalogos-api'

type CatalogOption = {
  value: string
  label: string
}

const fallbackSeveridadeOptions: CatalogOption[] = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
]

const fallbackComoIdentificadoOptions: CatalogOption[] = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'entrevistas', label: 'Entrevistas' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'feedback_direto', label: 'Feedback direto' },
  { value: 'monitoramento', label: 'Monitoramento' },
  { value: 'pesquisa', label: 'Pesquisa' },
  { value: 'competidores', label: 'Competidores' },
  { value: 'stakeholders', label: 'Stakeholders' },
]

const fallbackPublicoOptions: CatalogOption[] = [
  { value: 'novos_clientes', label: 'Novos clientes' },
  { value: 'clientes_medios', label: 'Clientes médios' },
  { value: 'persona_carlos', label: 'Persona Carlos' },
  { value: 'usuarios_internos', label: 'Usuários internos' },
]

const buildCatalogOptions = (
  itens: CatalogItem[] | undefined,
  fallback: CatalogOption[],
): CatalogOption[] => {
  if (!itens || itens.length === 0) {
    return fallback
  }

  return itens
    .filter((item) => item.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((item) => ({
      value: (item.metadata?.legacyValue as string | undefined) ?? item.slug,
      label: item.label,
    }))
}

const buildOptionMap = (options: CatalogOption[]) =>
  new Map(options.map((option) => [option.value.toString(), option]))

const createDiscoverySchema = z.object({
  demandaId: z.string().min(1, 'Selecione uma demanda'),
  titulo: z.string().min(5, 'Mínimo 5 caracteres').max(200, 'Máximo 200 caracteres'),
  descricao: z.string().min(10, 'Mínimo 10 caracteres'),
  contexto: z.string().optional(),
  publicoAfetado: z.array(z.string()).min(1, 'Adicione pelo menos um público afetado'),
  volumeImpactado: z.string().optional(),
  severidade: z.string().optional(),
  comoIdentificado: z.array(z.string()).min(1, 'Selecione como foi identificado'),
  responsavelId: z.string().min(1, 'Selecione um responsável'),
  produtoId: z.string().min(1, 'Selecione um produto'),
})

type CreateDiscoveryFormData = z.infer<typeof createDiscoverySchema>

interface CriarDiscoveryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  demandaId?: string
}

export function CriarDiscoveryModal({
  open,
  onOpenChange,
  onSuccess,
  demandaId: initialDemandaId,
}: CriarDiscoveryModalProps) {
  const criarDiscoveryMutation = useCriarDiscovery()
  const [newPublico, setNewPublico] = useState('')

  // Queries - listar demandas (excluindo arquivadas)
  const { data: demandas } = useListarDemandas({
    pageSize: 100,
    status: ['NOVO', 'RASCUNHO', 'TRIAGEM'], // Excluir arquivadas
  })
  const { data: produtos } = useListarProdutos()
  const { data: usuarios } = useListarUsuarios()
  const severidadeCatalog = useCatalogItemsBySlug('severidade_problema', {
    includeInativos: false,
  })
  const comoIdentificadoCatalog = useCatalogItemsBySlug('identificacao_origem', {
    includeInativos: false,
  })
  const publicoCatalog = useCatalogItemsBySlug('publico_alvo', {
    includeInativos: false,
  })

  const severidadeOptions = useMemo(
    () => buildCatalogOptions(severidadeCatalog.data?.itens, fallbackSeveridadeOptions),
    [severidadeCatalog.data?.itens],
  )

  const comoIdentificadoOptions = useMemo(
    () => buildCatalogOptions(comoIdentificadoCatalog.data?.itens, fallbackComoIdentificadoOptions),
    [comoIdentificadoCatalog.data?.itens],
  )

  const publicoOptions = useMemo(
    () => buildCatalogOptions(publicoCatalog.data?.itens, fallbackPublicoOptions),
    [publicoCatalog.data?.itens],
  )
  const publicoMap = useMemo(() => buildOptionMap(publicoOptions), [publicoOptions])

  const form = useForm<CreateDiscoveryFormData>({
    resolver: zodResolver(createDiscoverySchema),
    defaultValues: {
      demandaId: initialDemandaId || '',
      titulo: '',
      descricao: '',
      contexto: '',
      publicoAfetado: [],
      volumeImpactado: '',
      severidade: '',
      comoIdentificado: [],
      responsavelId: '',
      produtoId: '',
    },
  })

  const selectedDemanda = demandas?.data?.find((d: any) => d.id === form.watch('demandaId'))

  // Auto-preenche dados da demanda selecionada
  const handleDemandaChange = (demandaId: string) => {
    const demanda = demandas?.data?.find((d: any) => d.id === demandaId)
    if (demanda) {
      form.setValue('titulo', demanda.titulo)
      form.setValue('produtoId', demanda.produtoId)
    }
  }

  const handleAddPublico = () => {
    const value = newPublico.trim()
    if (!value) return
    const current = form.getValues('publicoAfetado')
    if (current.includes(value)) {
      setNewPublico('')
      return
    }
    form.setValue('publicoAfetado', [...current, value])
    setNewPublico('')
  }

  const handleRemovePublico = (index: number) => {
    const current = form.getValues('publicoAfetado')
    form.setValue(
      'publicoAfetado',
      current.filter((_, i) => i !== index),
    )
  }

  const onSubmit = async (data: CreateDiscoveryFormData) => {
    try {
      await criarDiscoveryMutation.mutateAsync(data)
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar discovery:', error)
      // O erro já é tratado pelo hook useCriarDiscovery
    }
  }

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
                  className="h-[85vh] max-h-[800px] w-full max-w-[75vw]"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                >
                  <div className="flex h-full flex-col rounded-lg border border-border bg-background shadow-xl">
                    <div className="border-b p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Dialog.Title className="text-2xl font-semibold text-text-primary">
                            Novo Product Discovery
                          </Dialog.Title>
                          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                            Preencha os campos para iniciar uma investigação estruturada da demanda
                            selecionada.
                          </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Fechar modal de criação de discovery"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    <Form {...form}>
                      <form
                        id="criar-discovery-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex-1 overflow-hidden"
                      >
                        <ScrollArea className="h-full">
                          <div className="space-y-6 p-6 pr-8">
                            <FormField
                              control={form.control}
                              name="demandaId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Demanda Base</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                      field.onChange(value)
                                      handleDemandaChange(value)
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a demanda para investigar" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {demandas?.data
                                        ?.filter(
                                          (demanda: any) =>
                                            demanda.status?.toUpperCase() !== 'ARQUIVADO',
                                        )
                                        .map((demanda: any) => (
                                          <SelectItem key={demanda.id} value={demanda.id}>
                                            #{demanda.id.slice(0, 8)} - {demanda.titulo}
                                          </SelectItem>
                                        ))}
                                      {(!demandas ||
                                        demandas.data?.filter(
                                          (d: any) => d.status?.toUpperCase() !== 'ARQUIVADO',
                                        ).length === 0) && (
                                        <SelectItem value="__empty" disabled>
                                          Nenhuma demanda disponível
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Selecione uma demanda triada para transformar em um discovery
                                    formal.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {selectedDemanda && (
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                                <div className="flex gap-2">
                                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                  <div className="text-sm">
                                    <p className="font-medium text-blue-900 dark:text-blue-100">
                                      Demanda selecionada
                                    </p>
                                    <p className="mt-1 text-blue-700 dark:text-blue-300">
                                      {selectedDemanda.titulo}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <FormField
                              control={form.control}
                              name="titulo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Título do Discovery</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Ex: Usuários abandonam onboarding no passo 3"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Um título claro e específico do problema a ser investigado.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="descricao"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição do Problema</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      className="min-h-[120px]"
                                      placeholder="Descreva o problema em detalhes..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="contexto"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contexto (Opcional)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      className="min-h-[80px]"
                                      placeholder="Dados adicionais, histórico, tentativas anteriores..."
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Compartilhe fatos relevantes que ajudam a equipe de discovery a
                                    iniciar.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="publicoAfetado"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Público Afetado</FormLabel>
                                  <div className="space-y-3">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Ex: Novos usuários, Clientes premium..."
                                        value={newPublico}
                                        onChange={(event) => setNewPublico(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter') {
                                            event.preventDefault()
                                            handleAddPublico()
                                          }
                                        }}
                                      />
                                      <Button type="button" size="sm" onClick={handleAddPublico}>
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    {publicoOptions.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {publicoOptions.map((option) => {
                                          const selected = field.value.includes(option.value)
                                          return (
                                            <Button
                                              key={option.value}
                                              type="button"
                                              variant={selected ? 'secondary' : 'outline'}
                                              size="sm"
                                              className="rounded-full px-3 text-xs"
                                              onClick={() => {
                                                if (selected) {
                                                  field.onChange(
                                                    field.value.filter(
                                                      (value) => value !== option.value,
                                                    ),
                                                  )
                                                } else {
                                                  field.onChange([...field.value, option.value])
                                                }
                                              }}
                                            >
                                              {option.label}
                                            </Button>
                                          )
                                        })}
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                      {field.value.map((publico, index) => {
                                        const option = publicoMap.get(publico)
                                        const label = option?.label ?? publico
                                        return (
                                          <Badge
                                            key={`${publico}-${index}`}
                                            variant="secondary"
                                            className="flex items-center gap-1"
                                          >
                                            <span>{label}</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemovePublico(index)}
                                              className="hover:text-destructive text-muted-foreground transition"
                                              aria-label={`Remover público ${label}`}
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  <FormDescription>
                                    Liste segmentos impactados diretamente pela hipótese em
                                    investigação. Utilize as sugestões para padronizar termos.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="volumeImpactado"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Volume Impactado (Opcional)</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Ex: 70% dos novos usuários, 500 clientes/mês..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="severidade"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Severidade (Opcional)</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {severidadeOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
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
                                        {produtos?.map((produto: any) => (
                                          <SelectItem key={produto.id} value={produto.id}>
                                            {produto.nome}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="comoIdentificado"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Como foi identificado?</FormLabel>
                                  <FormDescription>
                                    Marque todas as fontes de evidência usadas para detectar o
                                    problema.
                                  </FormDescription>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {comoIdentificadoOptions.length > 0 ? (
                                      comoIdentificadoOptions.map((option) => {
                                        const checked = field.value.includes(option.value)

                                        return (
                                          <label
                                            key={option.value}
                                            className="hover:border-primary flex cursor-pointer items-center space-x-2 rounded-md border border-border bg-card px-3 py-2 transition"
                                          >
                                            <input
                                              type="checkbox"
                                              className="rounded border-gray-300"
                                              checked={checked}
                                              onChange={(event) => {
                                                if (event.target.checked) {
                                                  field.onChange([...field.value, option.value])
                                                } else {
                                                  field.onChange(
                                                    field.value.filter(
                                                      (value) => value !== option.value,
                                                    ),
                                                  )
                                                }
                                              }}
                                            />
                                            <span className="text-sm">{option.label}</span>
                                          </label>
                                        )
                                      })
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Cadastre opções em Configurações → Catálogos flexíveis.
                                      </p>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="responsavelId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PM Responsável</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o PM responsável" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {usuarios
                                        ?.filter(
                                          (usuario: any) =>
                                            usuario.role === 'PM' || usuario.role === 'CPO',
                                        )
                                        .map((usuario: any) => (
                                          <SelectItem key={usuario.id} value={usuario.id}>
                                            {usuario.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </ScrollArea>
                      </form>
                    </Form>

                    <div className="border-t bg-background p-6">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            form.reset()
                            setNewPublico('')
                            onOpenChange(false)
                          }}
                          disabled={criarDiscoveryMutation.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          form="criar-discovery-form"
                          disabled={criarDiscoveryMutation.isPending}
                          loading={criarDiscoveryMutation.isPending}
                        >
                          {criarDiscoveryMutation.isPending ? 'Criando...' : 'Criar Discovery'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
