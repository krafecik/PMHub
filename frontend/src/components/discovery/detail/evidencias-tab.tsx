import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link2, Search, FilePlus } from 'lucide-react'

import { DiscoveryCompleto } from '@/lib/discovery-api'
import { useCatalogItemsBySlug } from '@/hooks/use-catalogos'
import { useCriarEvidencia } from '@/hooks/use-discovery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useDiscoverySearch } from '@/components/discovery/detail/search-context'
import { FadeIn } from '@/components/motion/fade-in'

type EvidenciasTabProps = {
  discovery: DiscoveryCompleto
}

const evidenciaSchema = z.object({
  titulo: z.string().min(3, 'Informe um título'),
  descricao: z.string().min(10, 'Detalhe a evidência'),
  tipo: z.string().min(1, 'Selecione o tipo'),
  hipoteseId: z.string().optional(),
  tags: z.string().optional(),
  arquivoUrl: z.string().url('Informe uma URL válida').optional().or(z.literal('')),
})

type EvidenciaFormValues = z.infer<typeof evidenciaSchema>

export function DiscoveryEvidenciasTab({ discovery }: EvidenciasTabProps) {
  const { globalSearchTerm } = useDiscoverySearch()
  const [typeFilter, setTypeFilter] = useState('all')
  const [hipoteseFilter, setHipoteseFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const tiposCatalog = useCatalogItemsBySlug('tipo_evidencia', { includeInativos: false })
  const criarEvidencia = useCriarEvidencia(discovery.id)

  const form = useForm<EvidenciaFormValues>({
    resolver: zodResolver(evidenciaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: tiposCatalog.data?.itens?.[0]?.slug ?? '',
      hipoteseId: undefined,
      tags: '',
      arquivoUrl: '',
    },
  })

  const hipoteseLookup = useMemo(() => {
    const map = new Map<string, string>()
    discovery.hipoteses.forEach((hipotese) => {
      map.set(hipotese.id, hipotese.titulo)
    })
    return map
  }, [discovery.hipoteses])

  const tipoLookup = useMemo(() => {
    const map = new Map<string, string>()
    tiposCatalog.data?.itens?.forEach((item) => map.set(item.slug, item.label))
    return map
  }, [tiposCatalog.data?.itens])

  const filteredEvidencias = useMemo(() => {
    return discovery.evidencias.filter((evidencia) => {
      const matchesType = typeFilter === 'all' || evidencia.tipo === typeFilter
      const matchesHipotese = hipoteseFilter === 'all' || evidencia.hipoteseId === hipoteseFilter
      const matchesLocal = matchesEvidenciaSearch(evidencia, searchTerm)
      const matchesGlobal = matchesEvidenciaSearch(evidencia, globalSearchTerm)

      return matchesType && matchesHipotese && matchesLocal && matchesGlobal
    })
  }, [discovery.evidencias, typeFilter, hipoteseFilter, searchTerm, globalSearchTerm])

  const handleCreateEvidencia = (values: EvidenciaFormValues) => {
    criarEvidencia.mutate(
      {
        titulo: values.titulo,
        descricao: values.descricao,
        tipo: values.tipo,
        hipoteseId:
          values.hipoteseId && values.hipoteseId !== 'none' ? values.hipoteseId : undefined,
        tags: splitToArray(values.tags),
        arquivoUrl: values.arquivoUrl || undefined,
      },
      {
        onSuccess: () => {
          form.reset({
            titulo: '',
            descricao: '',
            tipo: tiposCatalog.data?.itens?.[0]?.slug ?? '',
            hipoteseId: undefined,
            tags: '',
            arquivoUrl: '',
          })
          setDialogOpen(false)
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Evidências ({discovery.evidencias.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Consolide fatos, dados e artefatos que sustentam as hipóteses e decisões.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FilePlus className="h-4 w-4" />
              Nova evidência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar nova evidência</DialogTitle>
              <DialogDescription>
                Armazene fatos concretos que comprovam ou refutam hipóteses deste discovery.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateEvidencia)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: 70% abandonam no passo 3" {...field} />
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
                          minRows={4}
                          placeholder="Detalhe o que a evidência comprova"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposCatalog.data?.itens?.map((item) => (
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

                <FormField
                  control={form.control}
                  name="hipoteseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hipótese relacionada (opcional)</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === 'none' ? undefined : value)
                        }
                        value={field.value ?? 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a hipótese" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sem vínculo</SelectItem>
                          {discovery.hipoteses.map((hipotese) => (
                            <SelectItem key={hipotese.id} value={hipotese.id}>
                              {hipotese.titulo}
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
                  name="arquivoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arquivo / Link (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Separe por vírgula" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={criarEvidencia.isPending}>
                    {criarEvidencia.isPending ? 'Salvando...' : 'Registrar evidência'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {tiposCatalog.data?.itens?.map((item) => (
                <SelectItem key={item.id} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={hipoteseFilter} onValueChange={setHipoteseFilter}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Hipótese relacionada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as hipóteses</SelectItem>
              {discovery.hipoteses.map((hipotese) => (
                <SelectItem key={hipotese.id} value={hipotese.id}>
                  {hipotese.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 sm:max-w-[260px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-7"
            placeholder="Buscar por título ou tag"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {filteredEvidencias.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma evidência encontrada. Utilize o botão acima para registrar fatos relevantes ao
            discovery.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvidencias.map((evidencia, index) => {
            const tipoLabel = tipoLookup.get(evidencia.tipo) ?? evidencia.tipo
            const hipoteseTitulo = evidencia.hipoteseId
              ? hipoteseLookup.get(evidencia.hipoteseId)
              : undefined

            return (
              <FadeIn key={evidencia.id} delay={index * 0.05} className="h-full">
                <Card className="h-full border-border/80">
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{tipoLabel}</Badge>
                      {hipoteseTitulo && <Badge variant="outline">{hipoteseTitulo}</Badge>}
                      <Badge variant="outline">
                        {new Date(evidencia.createdAt).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold text-text-primary">
                      {evidencia.titulo}
                    </CardTitle>
                    <CardDescription className="line-clamp-4 text-sm text-muted-foreground">
                      {evidencia.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 text-sm">
                    {evidencia.arquivoUrl && (
                      <a
                        href={evidencia.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-2 hover:underline"
                      >
                        <Link2 className="h-4 w-4" />
                        Abrir anexo
                      </a>
                    )}

                    {evidencia.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {evidencia.tags.map((tag) => (
                          <Badge key={`${evidencia.id}-${tag}`} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            )
          })}
        </div>
      )}
    </div>
  )
}

const splitToArray = (value?: string): string[] | undefined => {
  if (!value) return undefined
  const tokens = value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
  return tokens.length > 0 ? tokens : undefined
}

const matchesEvidenciaSearch = (
  evidencia: DiscoveryCompleto['evidencias'][number],
  term: string,
) => {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return true
  return (
    evidencia.titulo.toLowerCase().includes(normalized) ||
    evidencia.descricao.toLowerCase().includes(normalized) ||
    evidencia.tags.some((tag) => tag.toLowerCase().includes(normalized))
  )
}
