import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as discoveryAPI from '@/lib/discovery-api'
import { toast } from 'sonner'

// Query keys
const queryKeys = {
  all: ['discoveries'],
  lists: () => [...queryKeys.all, 'list'],
  list: (params?: discoveryAPI.ListarDiscoveriesParams) => [...queryKeys.lists(), params],
  details: () => [...queryKeys.all, 'detail'],
  detail: (id: string) => [...queryKeys.details(), id],
  stats: () => [...queryKeys.all, 'stats'],
  stat: (produtoId?: string) => [...queryKeys.stats(), produtoId],
  insights: () => [...queryKeys.all, 'insights'],
  insightsRelated: (tags: string[], excludeId?: string) => [
    ...queryKeys.insights(),
    'related',
    { tags, excludeId },
  ],
}

// List Discoveries
export function useListarDiscoveries(params?: discoveryAPI.ListarDiscoveriesParams) {
  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: () => discoveryAPI.listarDiscoveries(params),
  })
}

// Get Discovery Statistics
export function useEstatisticasDiscovery(produtoId?: string) {
  return useQuery({
    queryKey: queryKeys.stat(produtoId),
    queryFn: () => discoveryAPI.obterEstatisticasDiscovery(produtoId),
  })
}

// Get Related Insights
export function useInsightsRelacionados(
  tags: string[],
  excludeDiscoveryId?: string,
  limit?: number,
) {
  return useQuery({
    queryKey: queryKeys.insightsRelated(tags, excludeDiscoveryId),
    queryFn: () => discoveryAPI.buscarInsightsRelacionados(tags, excludeDiscoveryId, limit),
    enabled: tags.length > 0,
  })
}

// Get Complete Discovery
export function useDiscoveryCompleto(discoveryId: string) {
  return useQuery({
    queryKey: queryKeys.detail(discoveryId),
    queryFn: () => discoveryAPI.obterDiscoveryCompleto(discoveryId),
    enabled: !!discoveryId,
  })
}

export function useEntrevistaDetalhe(pesquisaId?: string, entrevistaId?: string) {
  return useQuery({
    queryKey: ['entrevista', pesquisaId, entrevistaId],
    queryFn: () => {
      if (!pesquisaId || !entrevistaId) {
        throw new Error('IDs de pesquisa e entrevista são obrigatórios')
      }
      return discoveryAPI.obterEntrevistaDetalhe(pesquisaId, entrevistaId)
    },
    enabled: Boolean(pesquisaId && entrevistaId),
  })
}

// Create Discovery
export function useCriarDiscovery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.CriarDiscoveryData) => discoveryAPI.criarDiscovery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() })
      toast.success('Discovery criado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar discovery')
    },
  })
}

// Update Discovery
export function useAtualizarDiscovery(discoveryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.AtualizarDiscoveryData) =>
      discoveryAPI.atualizarDiscovery(discoveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(discoveryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      toast.success('Discovery atualizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar discovery')
    },
  })
}

// Create Hipotese
export function useCriarHipotese(discoveryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.CriarHipoteseData) =>
      discoveryAPI.criarHipotese(discoveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(discoveryId) })
      toast.success('Hipótese criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar hipótese')
    },
  })
}

// Register Pesquisa
export function useRegistrarPesquisa(discoveryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.RegistrarPesquisaData) =>
      discoveryAPI.registrarPesquisa(discoveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(discoveryId) })
      toast.success('Pesquisa registrada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao registrar pesquisa')
    },
  })
}

// Add Entrevista
export function useAdicionarEntrevista(pesquisaId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.AdicionarEntrevistaData) =>
      discoveryAPI.adicionarEntrevista(pesquisaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.details() })
      toast.success('Entrevista adicionada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao adicionar entrevista')
    },
  })
}

// Create Evidencia
export function useCriarEvidencia(discoveryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.CriarEvidenciaData) =>
      discoveryAPI.criarEvidencia(discoveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(discoveryId) })
      toast.success('Evidência criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar evidência')
    },
  })
}

// Generate Insight
export function useGerarInsight(discoveryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.GerarInsightData) =>
      discoveryAPI.gerarInsight(discoveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(discoveryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.insights() })
      toast.success('Insight gerado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao gerar insight')
    },
  })
}

// Start Experimento
export function useIniciarExperimento(discoveryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.IniciarExperimentoData) =>
      discoveryAPI.iniciarExperimento(discoveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(discoveryId) })
      toast.success('Experimento iniciado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao iniciar experimento')
    },
  })
}

// Finalize Discovery
export function useFinalizarDiscovery(discoveryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: discoveryAPI.FinalizarDiscoveryData) =>
      discoveryAPI.finalizarDiscovery(discoveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(discoveryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() })
      toast.success('Discovery finalizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao finalizar discovery')
    },
  })
}

// Update Hipotese Status
export function useAtualizarStatusHipotese() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      hipoteseId,
      status,
    }: {
      hipoteseId: string
      status: discoveryAPI.StatusHipotese
    }) => discoveryAPI.atualizarStatusHipotese(hipoteseId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.details() })
      toast.success('Status da hipótese atualizado!')
    },
    onError: () => {
      toast.error('Erro ao atualizar status da hipótese')
    },
  })
}

// Conclude Experimento
export function useConcluirExperimento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      experimentoId,
      resultados,
      pValue,
    }: {
      experimentoId: string
      resultados: any
      pValue?: number
    }) => discoveryAPI.concluirExperimento(experimentoId, resultados, pValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.details() })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() })
      toast.success('Experimento concluído com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao concluir experimento')
    },
  })
}
