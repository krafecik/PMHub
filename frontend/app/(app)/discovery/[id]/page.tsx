'use client'

import { useMemo, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Search, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HelpButton } from '@/components/ui/help-button'
import { useDiscoveryCompleto } from '@/hooks/use-discovery'
import {
  DiscoveryActivityLog,
  DiscoveryAssistant,
  DiscoveryDecisaoTab,
  DiscoveryEvidenciasTab,
  DiscoveryExperimentosTab,
  DiscoveryHipotesesTab,
  DiscoveryInsightsTab,
  DiscoveryOverview,
  DiscoveryPesquisasTab,
  DiscoveryProblemaTab,
} from '@/components/discovery/detail'
import {
  DiscoverySearchProvider,
  useDiscoverySearch,
} from '@/components/discovery/detail/search-context'
import { DiscoveryCompleto } from '@/lib/discovery-api'

type DiscoveryDetailPageProps = {
  params: { id: string }
}

export default function DiscoveryDetailPage({ params }: DiscoveryDetailPageProps) {
  const discoveryId = params.id

  const { data: discovery, isLoading, isError } = useDiscoveryCompleto(discoveryId)

  if (isError) {
    notFound()
  }

  if (isLoading || !discovery) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Carregando discovery...</p>
      </div>
    )
  }

  return (
    <DiscoverySearchProvider>
      <DiscoveryDetailContent discovery={discovery} />
    </DiscoverySearchProvider>
  )
}

type DiscoveryDetailContentProps = {
  discovery: DiscoveryCompleto
}

function DiscoveryDetailContent({ discovery }: DiscoveryDetailContentProps) {
  const router = useRouter()
  const { globalSearchTerm, setGlobalSearchTerm } = useDiscoverySearch()
  const [assistantOpen, setAssistantOpen] = useState(false)

  const tabConfig = useMemo(
    () => [
      { value: 'problema', label: 'Problema', component: DiscoveryProblemaTab },
      { value: 'hipoteses', label: 'Hipóteses', component: DiscoveryHipotesesTab },
      { value: 'pesquisas', label: 'Pesquisas', component: DiscoveryPesquisasTab },
      { value: 'evidencias', label: 'Evidências', component: DiscoveryEvidenciasTab },
      { value: 'insights', label: 'Insights', component: DiscoveryInsightsTab },
      { value: 'experimentos', label: 'MVP / Experimentos', component: DiscoveryExperimentosTab },
      { value: 'decisao', label: 'Decisão', component: DiscoveryDecisaoTab },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex items-center sm:w-64">
            <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={globalSearchTerm}
              onChange={(event) => setGlobalSearchTerm(event.target.value)}
              placeholder="Buscar em todo o discovery..."
              className="pl-7"
            />
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setAssistantOpen(true)}>
            <Sparkles className="text-primary h-4 w-4" />
            Copiloto
          </Button>
          <HelpButton
            title="Como usar o discovery"
            content={
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Esta visão consolida todo o trabalho de discovery: problema, hipóteses, pesquisas,
                  evidências, insights, experimentos e decisão final.
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Atualize continuamente o contexto e o aprendizado no topo da página.</li>
                  <li>Cada aba aprofunda uma etapa específica do processo de discovery.</li>
                  <li>A linha do tempo registra automaticamente as principais atividades.</li>
                  <li>
                    Finalize o discovery quando houver decisão validada, garantindo o handoff para o
                    time de delivery.
                  </li>
                </ul>
              </div>
            }
          />
        </div>
      </div>

      <DiscoveryOverview discovery={discovery} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <Tabs defaultValue="problema">
            <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
              {tabConfig.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="px-4 py-2">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfig.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                <tab.component discovery={discovery} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="space-y-6">
          <DiscoveryActivityLog discovery={discovery} />
        </div>
      </div>

      <DiscoveryAssistant
        discovery={discovery}
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
      />
    </div>
  )
}
