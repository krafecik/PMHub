import { api as axios } from './api'

// Catálogo defaults (mantidos para fallback)
export const STATUS_DISCOVERY_DEFAULTS = [
  'EM_PESQUISA',
  'VALIDANDO',
  'FECHADO',
  'CANCELADO',
] as const
export const STATUS_HIPOTESE_DEFAULTS = [
  'PENDENTE',
  'EM_TESTE',
  'VALIDADA',
  'REFUTADA',
  'ARQUIVADA',
] as const
export const METODO_PESQUISA_DEFAULTS = [
  'ENTREVISTA_GUIADA',
  'ENTREVISTA_LIVRE',
  'SURVEY',
  'FOCUS_GROUP',
  'OBSERVACAO',
  'TESTE_USABILIDADE',
  'CARD_SORTING',
  'DIARIO_USO',
] as const
export const STATUS_PESQUISA_DEFAULTS = [
  'PLANEJADA',
  'EM_ANDAMENTO',
  'CONCLUIDA',
  'CANCELADA',
] as const
export const TIPO_EVIDENCIA_DEFAULTS = [
  'DADOS_ANALYTICS',
  'PRINT',
  'VIDEO',
  'AUDIO',
  'FEEDBACK_USUARIO',
  'LOG_SISTEMA',
  'TRANSCRICAO',
  'RESULTADO_TESTE',
  'BENCHMARK',
  'DOCUMENTO',
] as const
export const STATUS_INSIGHT_DEFAULTS = ['RASCUNHO', 'VALIDADO', 'REFUTADO', 'EM_ANALISE'] as const
export const STATUS_EXPERIMENTO_DEFAULTS = [
  'PLANEJADO',
  'EM_EXECUCAO',
  'CONCLUIDO',
  'CANCELADO',
] as const

export type StatusDiscovery = (typeof STATUS_DISCOVERY_DEFAULTS)[number] | string
export type StatusHipotese = (typeof STATUS_HIPOTESE_DEFAULTS)[number] | string
export type MetodoPesquisa = (typeof METODO_PESQUISA_DEFAULTS)[number] | string
export type StatusPesquisa = (typeof STATUS_PESQUISA_DEFAULTS)[number] | string
export type TipoEvidencia = (typeof TIPO_EVIDENCIA_DEFAULTS)[number] | string
export type StatusInsight = (typeof STATUS_INSIGHT_DEFAULTS)[number] | string
export type StatusExperimento = (typeof STATUS_EXPERIMENTO_DEFAULTS)[number] | string

// Interfaces - List Items
export interface DiscoveryListItem {
  id: string
  demandaId: string
  titulo: string
  descricao: string
  status: StatusDiscovery
  statusLabel: string
  produtoId: string
  produtoNome?: string
  responsavelId: string
  responsavelNome?: string
  qtdHipoteses: number
  qtdPesquisas: number
  qtdInsights: number
  qtdExperimentos: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Interfaces - Complete Entities
export interface Hipotese {
  id: string
  titulo: string
  descricao: string
  comoValidar: string
  metricaAlvo?: string
  impactoEsperado: string
  prioridade: string
  status: StatusHipotese
  statusLabel: string
  qtdEvidencias: number
  qtdExperimentos: number
  createdAt: string
}

export interface Pesquisa {
  id: string
  titulo: string
  metodo: MetodoPesquisa
  metodoLabel: string
  objetivo: string
  roteiroUrl?: string
  status: StatusPesquisa
  statusLabel: string
  totalParticipantes: number
  participantesConcluidos: number
  progressoPercentual: number
  qtdEntrevistas: number
  entrevistas?: Entrevista[]
  createdAt: string
}

export interface Entrevista {
  id: string
  participanteNome: string
  participantePerfil?: string
  participanteEmail?: string
  dataHora: string
  transcricao?: string
  notas?: string
  gravacaoUrl?: string
  tags: string[]
  duracaoMinutos?: number
  createdAt: string
}

export interface EntrevistaDetalhe extends Entrevista {
  discoveryId: string
  pesquisaId: string
  insights: Array<{
    id: string
    descricao: string
    impacto: string
    impactoLabel: string
    confianca: string
    confiancaLabel: string
    status: string
    statusLabel: string
    createdAt: string
  }>
}

export interface Evidencia {
  id: string
  hipoteseId?: string
  tipo: TipoEvidencia
  tipoLabel: string
  titulo: string
  descricao: string
  arquivoUrl?: string
  tags: string[]
  createdAt: string
}

export interface Insight {
  id: string
  entrevistaId?: string
  descricao: string
  impacto: string
  impactoLabel?: string
  confianca: string
  confiancaLabel?: string
  status: StatusInsight
  statusLabel: string
  tags: string[]
  qtdEvidencias: number
  relevanceScore: number
  createdAt: string
}

export interface Experimento {
  id: string
  hipoteseId?: string
  titulo: string
  descricao: string
  tipo: string
  metricaSucesso: string
  status: StatusExperimento
  statusLabel: string
  hasResults: boolean
  pValue?: number
  isSignificant?: boolean
  resultados?: Record<string, unknown> | null
  createdAt: string
}

export interface HipoteseIaSugestao {
  titulo: string
  descricao: string
  impactoEsperado: string
  comoValidar: string
  prioridade: string
}

export interface InsightCorrelacaoIa {
  id: string
  grauCorrelacao: number
  comentario: string
}

export interface MvpIaSugestao {
  nome: string
  descricao: string
  hipotesesAlvo: string[]
  metricas: string[]
}

export interface DecisaoDiscovery {
  statusFinal: string
  resumo: string
  aprendizados: string[]
  recomendacoes: string[]
  proximosPassos: string[]
  decididoPorNome?: string
  dataDecisao?: string
  statusFinalLabel?: string
  materiaisAnexos?: Record<string, unknown> | null
}

export interface DiscoveryCompleto {
  id: string
  demandaId: string
  titulo: string
  descricao: string
  contexto?: string
  publicoAfetado: string[]
  volumeImpactado?: string
  severidade?: string
  severidadeLabel?: string
  comoIdentificado: string[]
  status: StatusDiscovery
  statusLabel: string
  produtoId: string
  produtoNome?: string
  responsavelId: string
  responsavelNome?: string
  criadoPorId: string
  criadoPorNome?: string
  hipoteses: Hipotese[]
  pesquisas: Pesquisa[]
  evidencias: Evidencia[]
  insights: Insight[]
  experimentos: Experimento[]
  decisao?: DecisaoDiscovery
  evolucaoLog: any[]
  createdAt: string
  updatedAt: string
}

export interface InsightRelacionado {
  id: string
  discoveryId: string
  discoveryTitulo?: string
  descricao: string
  impacto: string
  impactoLabel: string
  confianca: string
  confiancaLabel: string
  tags: string[]
  relevanceScore: number
  createdAt: string
}

export interface EstatisticasDiscovery {
  totalDiscoveries: number
  discoveriesEmPesquisa: number
  discoveriesValidando: number
  discoveriesFechados: number
  discoveriesCancelados: number

  totalHipoteses: number
  hipotesesValidadas: number
  hipotesesRefutadas: number
  taxaValidacaoHipoteses: number

  totalInsights: number
  insightsValidados: number
  insightsEmAnalise: number

  totalExperimentos: number
  experimentosConcluidos: number
  experimentosComResultadosSignificativos: number
  taxaSucessoExperimentos: number

  tempoMedioDiscovery?: number
  discoveriesTotaisPorProduto?: Record<string, number>
  evolucaoMensal?: Array<{
    mes: string
    total: number
    fechados: number
    cancelados: number
  }>
}

// DTOs for creation/update
export interface CriarDiscoveryData {
  demandaId: string
  titulo: string
  descricao: string
  contexto?: string
  publicoAfetado?: string[]
  volumeImpactado?: string
  severidade?: string
  comoIdentificado?: string[]
  responsavelId: string
  produtoId: string
}

export interface CriarHipoteseData {
  titulo: string
  descricao: string
  comoValidar: string
  metricaAlvo?: string
  impactoEsperado?: string
  prioridade?: string
}

export interface AtualizarDiscoveryData {
  titulo?: string
  descricao?: string
  contexto?: string
  publicoAfetado?: string[]
  volumeImpactado?: string
  severidade?: string
  comoIdentificado?: string[]
}

export interface RegistrarPesquisaData {
  titulo: string
  metodo: MetodoPesquisa
  objetivo: string
  roteiroUrl?: string
  totalParticipantes?: number
}

export interface AdicionarEntrevistaData {
  participanteNome: string
  participantePerfil?: string
  participanteEmail?: string
  dataHora: string
  transcricao?: string
  notas?: string
  gravacaoUrl?: string
  tags?: string[]
  duracaoMinutos?: number
}

export interface CriarEvidenciaData {
  hipoteseId?: string
  tipo: TipoEvidencia
  titulo: string
  descricao: string
  arquivoUrl?: string
  tags?: string[]
}

export interface GerarInsightData {
  entrevistaId?: string
  descricao: string
  impacto?: string
  confianca?: string
  tags?: string[]
  evidenciasIds?: string[]
}

export interface IniciarExperimentoData {
  hipoteseId?: string
  titulo: string
  descricao: string
  tipo: string
  metricaSucesso: string
  grupoControle?: any
  grupoVariante?: any
}

export interface FinalizarDiscoveryData {
  statusFinal: string
  resumo: string
  aprendizados?: string[]
  recomendacoes?: string[]
  proximosPassos?: string[]
  materiaisAnexos?: any
}

// API Functions
export interface ListarDiscoveriesParams {
  page?: number
  pageSize?: number
  status?: StatusDiscovery[]
  responsavelId?: string
  produtoId?: string
  searchTerm?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'titulo'
  sortOrder?: 'asc' | 'desc'
}

export async function listarDiscoveries(params?: ListarDiscoveriesParams) {
  const { data } = await axios.get('/discoveries', { params })
  return data
}

export async function obterEstatisticasDiscovery(produtoId?: string) {
  const params = produtoId ? { produtoId } : undefined
  const { data } = await axios.get('/discoveries/estatisticas', { params })
  return data
}

export async function buscarInsightsRelacionados(
  tags: string[],
  excludeDiscoveryId?: string,
  limit?: number,
) {
  const params = {
    tags,
    excludeDiscoveryId,
    limit,
  }
  const { data } = await axios.get('/discoveries/insights/relacionados', { params })
  return data
}

export async function obterDiscoveryCompleto(discoveryId: string) {
  const { data } = await axios.get(`/discoveries/${discoveryId}`)
  return data as DiscoveryCompleto
}

export async function obterDiscoveryPorDemandaId(
  demandaId: string,
): Promise<DiscoveryCompleto | null> {
  try {
    // Busca o Discovery através da listagem filtrando pelo demandaId
    // Como há relação 1:1, podemos buscar e filtrar no frontend
    const { data } = await axios.get('/discoveries', {
      params: {
        page: 1,
        pageSize: 100,
        searchTerm: demandaId,
      },
    })

    // Filtra pelo demandaId exato
    const discovery = data?.items?.find((item: DiscoveryListItem) => item.demandaId === demandaId)

    if (!discovery) {
      return null
    }

    // Busca o Discovery completo
    return obterDiscoveryCompleto(discovery.id)
  } catch (error) {
    console.warn('Erro ao buscar Discovery por demandaId:', error)
    return null
  }
}

export async function criarDiscovery(discoveryData: CriarDiscoveryData) {
  const { data } = await axios.post('/discoveries', discoveryData)
  return data
}

export async function atualizarDiscovery(discoveryId: string, payload: AtualizarDiscoveryData) {
  const { data } = await axios.put(`/discoveries/${discoveryId}`, payload)
  return data
}

export async function obterEntrevistaDetalhe(
  pesquisaId: string,
  entrevistaId: string,
): Promise<EntrevistaDetalhe> {
  const { data } = await axios.get(
    `/discoveries/pesquisas/${pesquisaId}/entrevistas/${entrevistaId}`,
  )
  return data
}

export async function criarHipotese(discoveryId: string, hipoteseData: CriarHipoteseData) {
  const { data } = await axios.post(`/discoveries/${discoveryId}/hipoteses`, hipoteseData)
  return data
}

export async function registrarPesquisa(discoveryId: string, pesquisaData: RegistrarPesquisaData) {
  const { data } = await axios.post(`/discoveries/${discoveryId}/pesquisas`, pesquisaData)
  return data
}

export async function adicionarEntrevista(
  pesquisaId: string,
  entrevistaData: AdicionarEntrevistaData,
) {
  const { data } = await axios.post(
    `/discoveries/pesquisas/${pesquisaId}/entrevistas`,
    entrevistaData,
  )
  return data
}

export async function criarEvidencia(discoveryId: string, evidenciaData: CriarEvidenciaData) {
  const { data } = await axios.post(`/discoveries/${discoveryId}/evidencias`, evidenciaData)
  return data
}

export async function gerarInsight(discoveryId: string, insightData: GerarInsightData) {
  const { data } = await axios.post(`/discoveries/${discoveryId}/insights`, insightData)
  return data
}

export async function iniciarExperimento(
  discoveryId: string,
  experimentoData: IniciarExperimentoData,
) {
  const { data } = await axios.post(`/discoveries/${discoveryId}/experimentos`, experimentoData)
  return data
}

export async function finalizarDiscovery(discoveryId: string, decisaoData: FinalizarDiscoveryData) {
  const { data } = await axios.put(`/discoveries/${discoveryId}/decisao`, decisaoData)
  return data
}

export async function sugerirHipotesesIa(discoveryId: string) {
  const { data } = await axios.post<{ hipoteses: HipoteseIaSugestao[] }>(
    `/discoveries/${discoveryId}/sugerir-hipoteses`,
  )
  return data.hipoteses
}

export async function correlacionarInsightsIa(discoveryId: string, insightId: string) {
  const { data } = await axios.post<{ correlacoes: InsightCorrelacaoIa[] }>(
    `/discoveries/${discoveryId}/correlacionar-insights`,
    { insightId },
  )
  return data.correlacoes
}

export async function sugerirMvpIa(discoveryId: string) {
  const { data } = await axios.post<{ mvps: MvpIaSugestao[] }>(
    `/discoveries/${discoveryId}/sugerir-mvp`,
  )
  return data.mvps
}

export async function gerarResumoExecutivoIa(discoveryId: string) {
  const { data } = await axios.post<{ resumo: string }>(
    `/discoveries/${discoveryId}/gerar-resumo-executivo`,
  )
  return data.resumo
}

export async function sintetizarEntrevistasIa(discoveryId: string, entrevistaIds?: string[]) {
  const { data } = await axios.post<{ resumo: string }>(
    `/discoveries/${discoveryId}/sintetizar-entrevistas`,
    entrevistaIds ? { entrevistaIds } : {},
  )
  return data.resumo
}

export async function atualizarStatusHipotese(hipoteseId: string, status: StatusHipotese) {
  const { data } = await axios.put(`/discoveries/hipoteses/${hipoteseId}/status`, { status })
  return data
}

export async function concluirExperimento(experimentoId: string, resultados: any, pValue?: number) {
  const { data } = await axios.put(`/discoveries/experimentos/${experimentoId}/concluir`, {
    resultados,
    pValue,
  })
  return data
}

// Helper functions
const STATUS_DISCOVERY_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  EM_PESQUISA: 'info',
  VALIDANDO: 'warning',
  FECHADO: 'success',
  CANCELADO: 'default',
}

export function getStatusDiscoveryVariant(status: StatusDiscovery) {
  const normalized = status?.toString().toUpperCase()
  return STATUS_DISCOVERY_VARIANTS[normalized] ?? 'default'
}

const STATUS_HIPOTESE_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'destructive'> = {
  PENDENTE: 'default',
  EM_TESTE: 'info',
  VALIDADA: 'success',
  REFUTADA: 'destructive',
  ARQUIVADA: 'default',
}

export function getStatusHipoteseVariant(status: StatusHipotese) {
  const normalized = status?.toString().toUpperCase()
  return STATUS_HIPOTESE_VARIANTS[normalized] ?? 'default'
}

const STATUS_PESQUISA_VARIANTS: Record<string, 'default' | 'info' | 'success'> = {
  PLANEJADA: 'default',
  EM_ANDAMENTO: 'info',
  CONCLUIDA: 'success',
  CANCELADA: 'default',
}

export function getStatusPesquisaVariant(status: StatusPesquisa) {
  const normalized = status?.toString().toUpperCase()
  return STATUS_PESQUISA_VARIANTS[normalized] ?? 'default'
}
