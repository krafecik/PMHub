import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, CircleAlert } from 'lucide-react'

import { DiscoveryCompleto } from '@/lib/discovery-api'
import { useFinalizarDiscovery } from '@/hooks/use-discovery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type DecisaoTabProps = {
  discovery: DiscoveryCompleto
}

const decisaoSchema = z.object({
  statusFinal: z.enum(['FECHADO', 'CANCELADO']),
  resumo: z.string().min(10, 'Descreva os aprendizados principais.'),
  aprendizados: z.string().optional(),
  recomendacoes: z.string().optional(),
  proximosPassos: z.string().optional(),
  materiaisAnexos: z.string().optional(),
})

type DecisaoFormValues = z.infer<typeof decisaoSchema>

const STATUS_CHOICES = [
  { value: 'FECHADO', label: 'Aprovado para handoff' },
  { value: 'CANCELADO', label: 'Discovery cancelado' },
]

export function DiscoveryDecisaoTab({ discovery }: DecisaoTabProps) {
  const decisao = discovery.decisao
  const finalizeDiscovery = useFinalizarDiscovery(discovery.id)
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<DecisaoFormValues>({
    resolver: zodResolver(decisaoSchema),
    defaultValues: {
      statusFinal: 'FECHADO',
      resumo: decisao?.resumo ?? '',
      aprendizados: decisao ? decisao.aprendizados.join('\n') : '',
      recomendacoes: decisao ? decisao.recomendacoes.join('\n') : '',
      proximosPassos: decisao ? decisao.proximosPassos.join('\n') : '',
      materiaisAnexos: decisao?.materiaisAnexos
        ? JSON.stringify(decisao.materiaisAnexos, null, 2)
        : '',
    },
  })

  const detalhesDecisao = useMemo(() => {
    if (!decisao) return null
    return {
      aprendizados: decisao.aprendizados ?? [],
      recomendacoes: decisao.recomendacoes ?? [],
      proximosPassos: decisao.proximosPassos ?? [],
      materiaisAnexos: decisao.materiaisAnexos,
    }
  }, [decisao])

  const onSubmit = (values: DecisaoFormValues) => {
    finalizeDiscovery.mutate(
      {
        statusFinal: values.statusFinal,
        resumo: values.resumo,
        aprendizados: splitLines(values.aprendizados),
        recomendacoes: splitLines(values.recomendacoes),
        proximosPassos: splitLines(values.proximosPassos),
        materiaisAnexos: parseJson(values.materiaisAnexos),
      },
      {
        onSuccess: () => setDialogOpen(false),
      },
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Decisão final</h3>
          <p className="text-sm text-muted-foreground">
            Consolide o entendimento, a recomendação e os próximos passos antes do handoff para o
            time de entrega.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {decisao ? 'Atualizar decisão' : 'Finalizar discovery'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar decisão executiva</DialogTitle>
              <DialogDescription>
                Defina o status final do discovery e comunique aprendizados relevantes.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="statusFinal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status final</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_CHOICES.map((choice) => (
                            <SelectItem key={choice.value} value={choice.value}>
                              {choice.label}
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
                  name="resumo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumo executivo</FormLabel>
                      <FormControl>
                        <Textarea
                          minRows={4}
                          placeholder="Resuma os principais achados e a motivação para esta decisão."
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
                    name="aprendizados"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principais aprendizados</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={4}
                            placeholder="Use uma linha por aprendizado"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recomendacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recomendações</FormLabel>
                        <FormControl>
                          <Textarea
                            minRows={4}
                            placeholder="Use uma linha por recomendação"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="proximosPassos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próximos passos</FormLabel>
                      <FormControl>
                        <Textarea
                          minRows={4}
                          placeholder="Plano de ação para handoff (uma linha por item)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materiaisAnexos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materiais anexos (JSON opcional)</FormLabel>
                      <FormControl>
                        <Textarea minRows={4} placeholder='Ex.: {"prd": "..."}' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={finalizeDiscovery.isPending}>
                    {finalizeDiscovery.isPending ? 'Salvando...' : 'Salvar decisão'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            {decisao ? 'Resumo da decisão' : 'Decisão pendente'}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {decisao
              ? 'Esta decisão está pronta para handoff. Revise aprendizados e recomendações abaixo.'
              : 'Defina o status final e documente os aprendizados antes de compartilhar com o time.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {decisao ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    decisao.statusFinal === 'CANCELADO' && 'bg-destructive/15 text-destructive',
                  )}
                >
                  {decisao.statusFinalLabel ?? decisao.statusFinal}
                </Badge>
                {decisao.dataDecisao && (
                  <span>
                    Registrado em {new Date(decisao.dataDecisao).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <p className="text-base text-text-primary">{decisao.resumo}</p>

              {detalhesDecisao?.aprendizados.length ? (
                <SectionList title="Principais aprendizados" items={detalhesDecisao.aprendizados} />
              ) : null}
              {detalhesDecisao?.recomendacoes.length ? (
                <SectionList title="Recomendações" items={detalhesDecisao.recomendacoes} />
              ) : null}
              {detalhesDecisao?.proximosPassos.length ? (
                <SectionList title="Próximos passos" items={detalhesDecisao.proximosPassos} />
              ) : null}
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
              <CircleAlert className="h-5 w-5 text-muted-foreground" />
              <p>
                Conclua experimentos relevantes e consolide aprendizados para registrar a decisão
                final deste discovery.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const SectionList = ({ title, items }: { title: string; items: string[] }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={`${title}-${index}`}>{item}</li>
      ))}
    </ul>
  </div>
)

const splitLines = (value?: string): string[] | undefined => {
  if (!value) return undefined
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines : undefined
}

const parseJson = (value?: string) => {
  if (!value || value.trim() === '') return undefined
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
