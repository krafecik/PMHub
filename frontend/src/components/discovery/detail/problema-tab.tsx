import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
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
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { useAtualizarDiscovery } from '@/hooks/use-discovery'
import { DiscoveryCompleto } from '@/lib/discovery-api'
import { useAutosave } from '@/hooks/use-autosave'

const problemaSchema = z.object({
  titulo: z.string().min(3, 'Informe um título com ao menos 3 caracteres').max(160),
  descricao: z
    .string()
    .min(10, 'Descreva o problema com pelo menos 10 caracteres')
    .max(4000, 'Descrição muito extensa'),
  contexto: z.string().max(4000).optional(),
  volumeImpactado: z.string().max(255).optional(),
  severidade: z.string().optional(),
  publicoAfetado: z.string().optional(),
  comoIdentificado: z.string().optional(),
})

type ProblemaFormValues = z.infer<typeof problemaSchema>

type ProblemaTabProps = {
  discovery: DiscoveryCompleto
}

export function DiscoveryProblemaTab({ discovery }: ProblemaTabProps) {
  const severidadeCatalog = useCatalogItemsBySlug('severidade_problema', {
    includeInativos: false,
  })
  const atualizarDiscovery = useAtualizarDiscovery(discovery.id)
  const [autosaveEnabled, setAutosaveEnabled] = useState(false)

  const form = useForm<ProblemaFormValues>({
    resolver: zodResolver(problemaSchema),
    defaultValues: mapDiscoveryToForm(discovery),
  })

  // Keep form synced if discovery changes by revalidation (e.g. after mutation)
  useEffect(() => {
    setAutosaveEnabled(false)
    form.reset(mapDiscoveryToForm(discovery))
    const timeout = setTimeout(() => setAutosaveEnabled(true), 100)
    return () => clearTimeout(timeout)
  }, [discovery, form])

  const watchedValues = form.watch()

  const autosavePayload = useMemo(
    () => ({
      titulo: watchedValues.titulo,
      descricao: watchedValues.descricao,
      contexto: watchedValues.contexto || undefined,
      volumeImpactado: watchedValues.volumeImpactado || undefined,
      severidade: watchedValues.severidade || undefined,
      publicoAfetado: splitToArray(watchedValues.publicoAfetado),
      comoIdentificado: splitToArray(watchedValues.comoIdentificado),
    }),
    [watchedValues],
  )

  const autosaveStatus = useAutosave(
    autosavePayload,
    async (payload) => {
      await atualizarDiscovery.mutateAsync(payload)
    },
    { enabled: autosaveEnabled },
  )

  const onSubmit = (values: ProblemaFormValues) => {
    const payload = {
      titulo: values.titulo,
      descricao: values.descricao,
      contexto: values.contexto || undefined,
      volumeImpactado: values.volumeImpactado || undefined,
      severidade: values.severidade || undefined,
      publicoAfetado: splitToArray(values.publicoAfetado),
      comoIdentificado: splitToArray(values.comoIdentificado),
    }

    atualizarDiscovery.mutate(payload)
  }

  const isSaving = atualizarDiscovery.isPending
  const severidadeOptions = severidadeCatalog.data?.itens ?? []
  const autosaveLabel =
    autosaveStatus === 'saving'
      ? 'Salvando mudanças...'
      : autosaveStatus === 'saved'
        ? 'Mudanças salvas automaticamente'
        : 'Sincronizado'

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Contexto do Problema</CardTitle>
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {autosaveLabel}
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do problema</FormLabel>
                  <FormControl>
                    <Input placeholder="Resuma o problema identificado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      minRows={5}
                      placeholder="Detalhe o que acontece, em que contexto e qual impacto."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contexto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contexto adicional</FormLabel>
                    <FormControl>
                      <Textarea
                        minRows={3}
                        placeholder="Dados, prints, links, histórico relevante..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="volumeImpactado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume impactado</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: 70% dos novos clientes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade percebida</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a severidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {severidadeOptions.map((item) => (
                            <SelectItem key={item.id} value={item.slug}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="publicoAfetado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Público afetado</FormLabel>
                    <FormControl>
                      <Textarea
                        minRows={3}
                        placeholder="Separe os públicos por vírgula. Ex.: Novos usuários, Clientes médios, Persona: Carlos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comoIdentificado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Como foi identificado</FormLabel>
                    <FormControl>
                      <Textarea
                        minRows={3}
                        placeholder="Separe as fontes por vírgula. Ex.: Analytics, Entrevistas, Suporte"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        {isSaving && (
          <p className="mt-2 text-xs text-muted-foreground" role="status" aria-live="assertive">
            Sincronizando com o servidor...
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const mapDiscoveryToForm = (discovery: DiscoveryCompleto): ProblemaFormValues => ({
  titulo: discovery.titulo,
  descricao: discovery.descricao ?? '',
  contexto: discovery.contexto ?? '',
  volumeImpactado: discovery.volumeImpactado ?? '',
  severidade: discovery.severidade ?? '',
  publicoAfetado: discovery.publicoAfetado.join(', '),
  comoIdentificado: discovery.comoIdentificado.join(', '),
})

const splitToArray = (value?: string): string[] | undefined => {
  if (!value) return undefined
  const tokens = value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
  return tokens.length > 0 ? tokens : undefined
}
