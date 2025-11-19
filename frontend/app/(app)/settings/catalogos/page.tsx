'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import { CategoryList } from '@/components/catalogos/category-list'
import { ItemTable } from '@/components/catalogos/item-table'
import { CategoryDialog, CategoryFormValues } from '@/components/catalogos/category-dialog'
import { ItemDialog } from '@/components/catalogos/item-dialog'
import {
  useCatalogCategory,
  useCreateCatalogCategory,
  useCreateCatalogItem,
  useDeleteCatalogItem,
  useListCatalogCategories,
  useUpdateCatalogCategory,
  useUpdateCatalogItem,
} from '@/hooks/use-catalogos'
import { CatalogCategory, CatalogItem } from '@/lib/catalogos-api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpButton } from '@/components/ui/help-button'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import {
  CatalogCategorySlugs,
  catalogSlugLabels,
  type CatalogCategorySlug,
} from '@/lib/catalogos/constants'

type ContextDefinition = {
  value: string
  label: string
  description: string
  slugs: CatalogCategorySlug[]
}

const CONTEXTS: ContextDefinition[] = [
  {
    value: 'captura',
    label: 'Captura de Demandas',
    description: 'Tipos, origens e prioridades utilizadas ao registrar uma demanda.',
    slugs: [
      CatalogCategorySlugs.TIPO_DEMANDA,
      CatalogCategorySlugs.ORIGEM_DEMANDA,
      CatalogCategorySlugs.PRIORIDADE_NIVEL,
      CatalogCategorySlugs.STATUS_DEMANDA,
      CatalogCategorySlugs.TIPO_USUARIO,
      CatalogCategorySlugs.CARGO_USUARIO,
      CatalogCategorySlugs.SEGMENTO_CLIENTE,
      CatalogCategorySlugs.TIPO_ANEXO,
      CatalogCategorySlugs.IDENTIFICACAO_ORIGEM,
    ],
  },
  {
    value: 'triagem',
    label: 'Triagem e Qualificação',
    description: 'Classificações usadas no modo Triagem (impacto, urgência, checklist).',
    slugs: [
      CatalogCategorySlugs.STATUS_TRIAGEM,
      CatalogCategorySlugs.IMPACTO_NIVEL,
      CatalogCategorySlugs.URGENCIA_NIVEL,
      CatalogCategorySlugs.COMPLEXIDADE_NIVEL,
      CatalogCategorySlugs.MOTIVO_ARQUIVAMENTO,
      CatalogCategorySlugs.TIPO_SOLICITACAO_INFO,
    ],
  },
  {
    value: 'discovery',
    label: 'Product Discovery',
    description: 'Status, métodos e classificações da jornada de discovery.',
    slugs: [
      CatalogCategorySlugs.STATUS_DISCOVERY,
      CatalogCategorySlugs.SEVERIDADE_PROBLEMA,
      CatalogCategorySlugs.IMPACTO_INSIGHT,
      CatalogCategorySlugs.CONFIANCA_INSIGHT,
      CatalogCategorySlugs.STATUS_INSIGHT,
      CatalogCategorySlugs.STATUS_HIPOTESE,
      CatalogCategorySlugs.IMPACTO_HIPOTESE,
      CatalogCategorySlugs.PRIORIDADE_HIPOTESE,
      CatalogCategorySlugs.METODO_PESQUISA,
      CatalogCategorySlugs.STATUS_PESQUISA,
      CatalogCategorySlugs.TIPO_EVIDENCIA,
      CatalogCategorySlugs.TIPO_EXPERIMENTO,
      CatalogCategorySlugs.STATUS_EXPERIMENTO,
      CatalogCategorySlugs.DECISAO_DISCOVERY,
      CatalogCategorySlugs.DECISAO_FINAL_DISCOVERY,
      CatalogCategorySlugs.METRICA_SUCESSO_DISCOVERY,
      CatalogCategorySlugs.PERSONA_PARTICIPANTE,
      CatalogCategorySlugs.PUBLICO_ALVO,
      CatalogCategorySlugs.IDENTIFICACAO_ORIGEM,
    ],
  },
  {
    value: 'planejamento',
    label: 'Planejamento',
    description: 'Status e indicadores utilizados nos módulos de planejamento.',
    slugs: [
      CatalogCategorySlugs.PLANEJAMENTO_EPICO_STATUS,
      CatalogCategorySlugs.PLANEJAMENTO_EPICO_HEALTH,
      CatalogCategorySlugs.PLANEJAMENTO_FEATURE_STATUS,
      CatalogCategorySlugs.PLANEJAMENTO_DEPENDENCIA_TIPO,
      CatalogCategorySlugs.PLANEJAMENTO_DEPENDENCIA_RISCO,
      CatalogCategorySlugs.PLANEJAMENTO_COMMITMENT_TIER,
      CatalogCategorySlugs.PLANEJAMENTO_CENARIO_STATUS,
      CatalogCategorySlugs.PLANEJAMENTO_SQUAD_STATUS,
      CatalogCategorySlugs.PLANNING_CYCLE_STATUS,
    ],
  },
  {
    value: 'automacao',
    label: 'Automação',
    description: 'Campos, operadores e ações disponíveis nas regras automáticas.',
    slugs: [
      CatalogCategorySlugs.AUTOMACAO_CAMPOS,
      CatalogCategorySlugs.AUTOMACAO_OPERADORES,
      CatalogCategorySlugs.AUTOMACAO_ACOES,
    ],
  },
  {
    value: 'transversais',
    label: 'Catálogos Transversais',
    description: 'Elementos compartilhados entre módulos e governança.',
    slugs: [
      CatalogCategorySlugs.CATALOGO_TAGS,
      CatalogCategorySlugs.FRAMEWORKS_PRIORIZACAO,
      CatalogCategorySlugs.TEMPLATES_NOTIFICACAO,
      CatalogCategorySlugs.TIPOS_WORKFLOW,
      CatalogCategorySlugs.CAMPOS_CUSTOMIZADOS,
      CatalogCategorySlugs.INTEGRACOES_EXTERNAS,
    ],
  },
]

const ajudaCatalogosContent = (
  <div className="space-y-4 text-left">
    <p>
      Utilize os catálogos flexíveis para adaptar o vocabulário e os fluxos às práticas do seu time.
      Cada item criado aqui fica imediatamente disponível nas telas de captura, triagem, discovery,
      automação e planejamento.
    </p>
    <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
      <li>Escolha o contexto (ex.: Captura, Triagem, Discovery) para visualizar as categorias.</li>
      <li>Crie ou edite as categorias para representar grupos de valores (status, tipos, etc.).</li>
      <li>
        Em cada categoria, cadastre os itens com slug, rótulo, ordem e metadados que serão usados
        nas validações.
      </li>
      <li>
        Itens inativos ficam indisponíveis nas telas, mas permanecem para histórico e regras
        automáticas.
      </li>
      <li>
        Utilize metadados JSON para configurar cores, pesos, transições e outros comportamentos
        avançados — nas categorias de automação, por exemplo, é possível indicar se um operador
        exige valor ou se uma ação requer campo/configuração adicionais.
      </li>
    </ol>
    <p className="text-sm text-muted-foreground">
      Boas práticas: mantenha convenções de slug em minúsculo, documente metadados críticos e
      versione alterações que impactam workflows.
    </p>
  </div>
)

type CategoriesByContext = Record<string, CatalogCategory[]>

function groupCategoriesByContext(categories: CatalogCategory[]): CategoriesByContext {
  const grouped: CategoriesByContext = {}
  const knownSlugs = new Set<string>(CONTEXTS.flatMap((context) => context.slugs))

  CONTEXTS.forEach((context) => {
    grouped[context.value] = categories.filter((categoria) =>
      context.slugs.includes(categoria.slug as (typeof context.slugs)[number]),
    )
  })

  const outros = categories.filter((categoria) => !knownSlugs.has(categoria.slug))
  if (outros.length > 0) {
    grouped.outros = outros
  }

  return grouped
}

function findFirstCategoryId(list: CatalogCategory[]): string | null {
  return list.length > 0 ? list[0].id : null
}

export default function CatalogosSettingsPage() {
  const [activeContext, setActiveContext] = useState<string>(CONTEXTS[0].value)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const { toast } = useToast()

  const { data: categoriasResponse, isLoading: isLoadingCategorias } = useListCatalogCategories({
    pageSize: 200,
    includeItens: false,
    includeDeleted: false,
    orderBy: 'nome',
    orderDirection: 'asc',
  })
  const categories = useMemo(() => categoriasResponse?.data ?? [], [categoriasResponse])

  const categoriesByContext = useMemo(() => groupCategoriesByContext(categories), [categories])

  const missingSlugsByContext = useMemo(() => {
    const existingSlugs = new Set(categories.map((categoria) => categoria.slug))
    const map: Record<string, CatalogCategorySlug[]> = {}

    CONTEXTS.forEach((context) => {
      map[context.value] = context.slugs.filter(
        (slug) => !existingSlugs.has(slug),
      ) as CatalogCategorySlug[]
    })

    return map
  }, [categories])

  const contextsWithData = useMemo(() => {
    const extraContexts =
      categoriesByContext.outros && categoriesByContext.outros.length > 0
        ? [
            ...CONTEXTS,
            {
              value: 'outros',
              label: 'Outros Catálogos',
              description: 'Valores adicionais ou provisórios.',
              slugs: [],
            },
          ]
        : CONTEXTS
    return extraContexts
  }, [categoriesByContext])

  React.useEffect(() => {
    const contextCategories = categoriesByContext[activeContext] ?? []
    if (contextCategories.length === 0) {
      setSelectedCategoryId(null)
      return
    }
    setSelectedCategoryId((current) => {
      if (current && contextCategories.some((categoria) => categoria.id === current)) {
        return current
      }
      return findFirstCategoryId(contextCategories)
    })
  }, [activeContext, categoriesByContext])

  const { data: selectedCategoryData, isLoading: isLoadingCategoria } = useCatalogCategory(
    selectedCategoryId ?? undefined,
    {
      includeItens: true,
      includeItensInativos: true,
    },
    { enabled: Boolean(selectedCategoryId) },
  )

  const createCategoryMutation = useCreateCatalogCategory()
  const updateCategoryMutation = useUpdateCatalogCategory(editingCategory?.id)

  const createItemMutation = useCreateCatalogItem(selectedCategoryId ?? undefined)
  const [itemBeingEdited, setItemBeingEdited] = useState<string | null>(null)
  const updateItemMutation = useUpdateCatalogItem(
    itemBeingEdited ?? '',
    selectedCategoryId ?? undefined,
  )
  const deleteItemMutation = useDeleteCatalogItem(selectedCategoryId ?? undefined)

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  const handleEditCategory = (categoria: CatalogCategory) => {
    setEditingCategory(categoria)
    setCategoryDialogOpen(true)
  }

  const handleSubmitCategory = async (values: CategoryFormValues) => {
    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({
        nome: values.nome,
        descricao: values.descricao ?? null,
        escopoProduto: values.escopoProduto,
      })
      setCategoryDialogOpen(false)
    } else {
      const categoria = await createCategoryMutation.mutateAsync({
        nome: values.nome,
        slug: values.slug,
        descricao: values.descricao ?? null,
        escopoProduto: values.escopoProduto,
      })
      setCategoryDialogOpen(false)
      setActiveContext((currentContext) => {
        const belongsTo = contextsWithData.find((context) =>
          context.slugs.includes(categoria.slug as CatalogCategorySlug),
        )
        return belongsTo?.value ?? currentContext
      })
      setSelectedCategoryId(categoria.id)
    }
  }

  const handleCreateItem = () => {
    setEditingItem(null)
    setItemBeingEdited(null)
    setItemDialogOpen(true)
  }

  const handleEditItem = (item: CatalogItem) => {
    setEditingItem(item)
    setItemBeingEdited(item.id)
    setItemDialogOpen(true)
  }

  const handleSubmitItem = async (values: {
    label: string
    slug?: string
    descricao?: string | null
    ordem?: number
    ativo?: boolean
    produtoId?: string
    metadata?: Record<string, unknown>
  }) => {
    if (!selectedCategoryId) {
      toast({
        title: 'Selecione uma categoria',
        description: 'Escolha uma categoria antes de cadastrar itens.',
        variant: 'destructive',
      })
      return
    }

    if (editingItem) {
      await updateItemMutation.mutateAsync(values)
    } else {
      await createItemMutation.mutateAsync(values)
    }
    setItemDialogOpen(false)
  }

  const handleDeleteItem = async (item: CatalogItem) => {
    const confirmed = window.confirm(
      `Deseja desativar o item "${item.label}"? Ele deixará de aparecer nas telas.`,
    )
    if (!confirmed) return
    await deleteItemMutation.mutateAsync(item.id)
  }

  const contextCategories = categoriesByContext[activeContext] ?? []
  const selectedCategory =
    selectedCategoryData ??
    contextCategories.find((categoria) => categoria.id === selectedCategoryId) ??
    null
  const items = selectedCategory?.itens ?? []

  // Loading inicial - quando está carregando as categorias pela primeira vez
  if (isLoadingCategorias && !categoriasResponse) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Configurações</p>
            <h1 className="text-foreground text-3xl font-bold">Catálogos flexíveis</h1>
            <p className="text-sm text-muted-foreground">
              Centralize os valores usados nos fluxos de captura, triagem, discovery, automação,
              planejamento e governança.
            </p>
          </div>
          <HelpButton title="Ajuda - Catálogos flexíveis" content={ajudaCatalogosContent} />
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando catálogos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Configurações</p>
          <h1 className="text-foreground text-3xl font-bold">Catálogos flexíveis</h1>
          <p className="text-sm text-muted-foreground">
            Centralize os valores usados nos fluxos de captura, triagem, discovery, automação,
            planejamento e governança.
          </p>
        </div>
        <HelpButton title="Ajuda - Catálogos flexíveis" content={ajudaCatalogosContent} />
      </div>

      <Tabs value={activeContext} onValueChange={setActiveContext} className="space-y-4">
        <TabsList>
          {contextsWithData.map((context) => (
            <TabsTrigger key={context.value} value={context.value}>
              {context.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {contextsWithData.map((context) => {
          const missingSlugs = missingSlugsByContext[context.value] ?? []
          const categoriesForContext = categoriesByContext[context.value] ?? []

          return (
            <TabsContent key={context.value} value={context.value}>
              <div className="mb-4 flex items-start gap-2">
                <AlertTriangle className="text-primary mt-1 h-4 w-4" />
                <p className="text-sm text-muted-foreground">{context.description}</p>
              </div>

              {context.value !== 'outros' && missingSlugs.length > 0 && (
                <div className="mb-4 rounded-lg border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-medium">Catálogos pendentes neste contexto:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                    {missingSlugs.map((slug) => (
                      <li key={slug}>{catalogSlugLabels[slug] ?? slug}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs opacity-80">
                    Utilize “Nova categoria” para cadastrar os catálogos que ainda não existem.
                  </p>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <div className="h-[520px]">
                  {isLoadingCategorias ? (
                    <SkeletonCard className="h-full" />
                  ) : (
                    <CategoryList
                      categories={categoriesForContext}
                      selectedId={selectedCategoryId}
                      onSelect={(id) => setSelectedCategoryId(id)}
                      onCreate={handleCreateCategory}
                      onEdit={(categoria) => {
                        handleEditCategory(categoria)
                      }}
                    />
                  )}
                  {categoriesForContext.length === 0 && !isLoadingCategorias && (
                    <div className="mt-3 rounded-lg border border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground">
                      Nenhuma categoria configurada para este contexto. Comece criando uma nova
                      categoria.
                      <div className="mt-3">
                        <Button variant="outline" size="sm" onClick={handleCreateCategory}>
                          Criar primeira categoria
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-[520px]">
                  {selectedCategoryId ? (
                    <ItemTable
                      items={items}
                      onCreate={handleCreateItem}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      isLoading={isLoadingCategoria}
                    />
                  ) : (
                    <SkeletonCard className="h-full" />
                  )}
                </div>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null)
          }
          setCategoryDialogOpen(open)
        }}
        category={editingCategory}
        loading={
          editingCategory ? updateCategoryMutation.isPending : createCategoryMutation.isPending
        }
        onSubmit={handleSubmitCategory}
      />

      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null)
            setItemBeingEdited(null)
          }
          setItemDialogOpen(open)
        }}
        category={selectedCategory}
        item={editingItem}
        loading={editingItem ? updateItemMutation.isPending : createItemMutation.isPending}
        onSubmit={handleSubmitItem}
      />
    </div>
  )
}
