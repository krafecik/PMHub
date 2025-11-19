'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
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
import { criarOuAtualizarEpico } from '@/lib/planejamento-api'
import { useListarProdutos } from '@/hooks/use-produtos'
import { useListarUsuarios } from '@/hooks/use-usuarios'
import { useListarSquads } from '@/hooks/use-squads'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { HelpButton } from '@/components/ui/help-button'

const schema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  produtoId: z.string().min(1, 'Selecione um produto'),
  quarter: z.string().min(1, 'Selecione um quarter'),
  ownerId: z.string().min(1, 'Selecione um owner'),
  descricao: z.string().optional(),
  objetivo: z.string().optional(),
  valueProposition: z.string().optional(),
  criteriosAceite: z.string().optional(),
  riscos: z.string().optional(),
  squadId: z.string().optional(),
  sponsorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  health: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const epicoFormHelpContent = (
  <div className="space-y-4">
    <p>
      Crie um novo épico definindo título, produto, quarter, owner e outras informações importantes.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Campos obrigatórios:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>Título - Nome descritivo do épico</li>
        <li>Produto - Produto ao qual o épico pertence</li>
        <li>Quarter - Trimestre de planejamento</li>
        <li>Owner - Responsável pelo épico</li>
      </ul>
    </div>
  </div>
)

export default function NovoEpicoPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: produtos } = useListarProdutos()
  const { data: usuarios } = useListarUsuarios()
  const { data: squads } = useListarSquads()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'PLANNED',
      health: 'GREEN',
    },
  })

  const mutation = useMutation({
    mutationFn: criarOuAtualizarEpico,
    onSuccess: (data) => {
      toast.success('Épico criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['epicos'] })
      router.push(`/planejamento/epicos/${data.epicoId}`)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao criar épico')
    },
  })

  function onSubmit(values: FormValues) {
    mutation.mutate({
      ...values,
      progressPercent: 0,
    })
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary">Novo Épico</h1>
          <p className="text-text-secondary">Crie um novo épico para o planejamento</p>
        </div>
        <HelpButton title="Ajuda - Criar Épico" content={epicoFormHelpContent} />
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Informações Básicas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: API v3 Migration" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="produtoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {produtos?.map((produto) => (
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

              <FormField
                control={form.control}
                name="quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quarter *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                        <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                        <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                        <SelectItem value="Q4 2026">Q4 2026</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usuarios?.map((usuario) => (
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

              <FormField
                control={form.control}
                name="squadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Squad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o squad (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {squads?.map((squad) => (
                          <SelectItem key={squad.id} value={squad.id}>
                            {squad.nome}
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
                name="sponsorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sponsor (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usuarios?.map((usuario) => (
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
          </Card>

          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Descrição e Contexto</h2>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o épico de forma detalhada..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="O que será entregue e por quê..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueProposition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value Proposition</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="O valor que será gerado..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Critérios e Riscos</h2>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="criteriosAceite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Critérios de Aceite</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste os critérios de aceite, um por linha..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="riscos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Riscos Identificados</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste os riscos identificados, um por linha..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Datas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Entrega Prevista</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? 'Salvando...' : 'Salvar Épico'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
