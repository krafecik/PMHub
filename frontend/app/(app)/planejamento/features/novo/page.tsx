'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
import { criarOuAtualizarFeature } from '@/lib/planejamento-api'
import { useListarSquads } from '@/hooks/use-squads'
import { useQuery } from '@tanstack/react-query'
import { listarEpicos } from '@/lib/planejamento-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { HelpButton } from '@/components/ui/help-button'

const schema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  epicoId: z.string().min(1, 'Selecione um épico'),
  descricao: z.string().optional(),
  squadId: z.string().optional(),
  pontos: z.number().min(0).optional(),
  riscos: z.string().optional(),
  criteriosAceite: z.string().optional(),
  status: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const featureFormHelpContent = (
  <div className="space-y-4">
    <p>
      Crie uma nova feature vinculada a um épico. Features são os blocos menores que compõem um
      épico.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Campos obrigatórios:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>Título - Nome descritivo da feature</li>
        <li>Épico - Épico ao qual a feature pertence</li>
      </ul>
    </div>
  </div>
)

export default function NovaFeaturePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const epicoIdParam = searchParams.get('epicoId')
  const queryClient = useQueryClient()
  const { data: squads } = useListarSquads()
  const { data: epicosData } = useQuery({
    queryKey: ['epicos'],
    queryFn: () => listarEpicos({ quarter: 'Q1 2026' }),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      epicoId: epicoIdParam || '',
      status: 'PLANNED',
    },
  })

  const mutation = useMutation({
    mutationFn: criarOuAtualizarFeature,
    onSuccess: (data) => {
      toast.success('Feature criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['features'] })
      router.push(`/planejamento/features/${data.featureId}`)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao criar feature')
    },
  })

  function onSubmit(values: FormValues) {
    mutation.mutate(values)
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary">Nova Feature</h1>
          <p className="text-text-secondary">Crie uma nova feature para um épico</p>
        </div>
        <HelpButton title="Ajuda - Criar Feature" content={featureFormHelpContent} />
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
                      <Input placeholder="Ex: Core Services Migration" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="epicoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Épico *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o épico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {epicosData?.data.map((epico) => (
                          <SelectItem key={epico.id} value={epico.id}>
                            {epico.titulo}
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
                name="pontos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pontos (Story Points)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Ex: 34"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Descrição</h2>
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a feature de forma detalhada..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? 'Salvando...' : 'Salvar Feature'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
