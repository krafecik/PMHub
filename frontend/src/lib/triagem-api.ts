import { api } from './api'

// Types
export interface DemandaPendenteTriagem {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  tipoLabel: string
  origem: string
  origemLabel: string
  produto: {
    id: string
    nome: string
  }
  responsavel?: {
    id: string
    nome: string
  }
  criadoPor?: {
    id: string
    nome: string
  }
  triagem: {
    id: string
    status: string
    statusLabel: string
    impacto?: string
    urgencia?: string
    complexidade?: string
    checklist: ChecklistItem[]
    revisoesTriagem: number
    diasEmTriagem: number
    aguardandoInfo: boolean
    possivelDuplicata?: boolean
  }
  createdAt: string
}

export interface ChecklistItem {
  id: string
  label: string
  required: boolean
  completed: boolean
  completedAt?: string
}

// Interface completa para demanda em triagem (usada no componente de checklist)
export interface DemandaTriagem {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  origem: string
  produtoId: string | null
  anexos?: Array<{
    id: string
    nome: string
    url: string
  }>
  triagem?: {
    id: string
    status: string
    impacto?: string
    urgencia?: string
    complexidade?: string
    duplicatasRevisadas?: boolean
  }
  duplicatasSugeridas?: Array<{
    id: string
    titulo: string
    similaridade: number
  }>
}

export interface TriagemSinal {
  tipo: string
  titulo: string
  descricao: string
  severidade: 'danger' | 'warning' | 'success'
}

export interface TriagemSugestaoRelacionado {
  id: string
  titulo: string
  referencia?: string
  tipo: 'demanda' | 'discovery'
  metadados?: Record<string, unknown>
}

export interface TriagemSugestao {
  tipo: string
  titulo: string
  descricao: string
  prioridade: 'alta' | 'media' | 'baixa'
  relacionados?: TriagemSugestaoRelacionado[]
}

export interface EstatisticasTriagem {
  totalPendentes: number
  aguardandoInfo: number
  prontosDiscovery: number
  arquivados: number
  duplicados: number
  slaMedio: number
  taxaDuplicacao: number
  tempoMedioAguardandoInfo: number
  taxaArquivamento: number
  taxaAprovacao: number
  distribuicaoPorStatus: Record<string, number>
  distribuicaoPorImpacto: Record<string, number>
  distribuicaoPorUrgencia: Record<string, number>
}

export interface DuplicataSugerida {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  origem: string
  produtoNome: string
  similaridade: number
  createdAt: string
  status: string
}

export interface DuplicataIaSugestao {
  id: string
  titulo: string
  descricao?: string
  similaridadeCalculada: number
  similaridadeIa: number
  justificativa: string
  tipo: string
  origem: string
  status: string
}

export interface SugestaoEncaminhamentoIa {
  acaoRecomendada: 'ENVIAR_DISCOVERY' | 'SOLICITAR_INFO' | 'ARQUIVAR' | 'VIRAR_EPICO' | 'AGUARDAR'
  justificativa: string
  checklist: string[]
}

export interface ListarDemandasPendentesParams {
  filtros?: {
    produtoId?: string
    tipo?: string | string[]
    origem?: string | string[]
    responsavelId?: string
    status?: string | string[]
  }
  paginacao?: {
    page?: number
    pageSize?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  }
}

export interface TriarDemandaPayload {
  novoStatus?: string
  impacto?: string
  urgencia?: string
  complexidade?: string
  observacoes?: string
  checklistAtualizacoes?: Array<{
    itemId: string
    completed: boolean
  }>
}

export interface SolicitarInformacaoPayload {
  solicitanteId: string
  texto: string
  prazo?: string
}

export interface MarcarDuplicataPayload {
  demandaOriginalId: string
  similaridade?: number
}

// API functions
export async function listarDemandasPendentes(params: ListarDemandasPendentesParams) {
  const queryParams = new URLSearchParams()

  if (params.filtros) {
    Object.entries(params.filtros).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(`filter[${key}]`, v))
        } else {
          queryParams.append(`filter[${key}]`, value)
        }
      }
    })
  }

  if (params.paginacao) {
    const { page = 1, pageSize = 20, orderBy, orderDirection } = params.paginacao
    queryParams.append('page', page.toString())
    queryParams.append('page_size', pageSize.toString())
    if (orderBy) queryParams.append('sort', `${orderDirection === 'desc' ? '-' : ''}${orderBy}`)
  }

  const response = await api.get<{ data: DemandaPendenteTriagem[]; total: number }>(
    `/triagem/demandas-pendentes?${queryParams}`,
  )
  return response.data
}

export async function obterEstatisticasTriagem() {
  const response = await api.get<EstatisticasTriagem>('/triagem/estatisticas')
  return response.data
}

export async function buscarDuplicatasSugeridas(demandaId: string) {
  const response = await api.get<DuplicataSugerida[]>(`/triagem/demandas/${demandaId}/duplicatas`)
  return response.data
}

export async function gerarSugestoesDuplicacaoIa(demandaId: string) {
  const response = await api.post<{ sugestoes: DuplicataIaSugestao[] }>(
    `/triagem/demandas/${demandaId}/sugestoes-duplicacao`,
  )
  return response.data.sugestoes
}

export async function gerarSugestaoEncaminhamentoIa(demandaId: string) {
  const response = await api.post<{ sugestao: SugestaoEncaminhamentoIa }>(
    `/triagem/demandas/${demandaId}/sugestao-encaminhamento`,
  )
  return response.data.sugestao
}

export interface HistoricoSolucao {
  demandaId: string
  titulo: string
  produtoNome: string
  tipo: string
  statusTriagem: string
  statusTriagemLabel: string
  similaridade: number
  criadoEm: string
}

export async function obterHistoricoSolucoes(demandaId: string) {
  const response = await api.get<{ historico: HistoricoSolucao[] }>(
    `/triagem/demandas/${demandaId}/historico`,
  )
  return response.data
}

export async function evoluirParaEpico(
  demandaId: string,
  payload: {
    nomeEpico: string
    objetivoEpico: string
    produtoId: string
  },
) {
  const response = await api.post(`/triagem/demandas/${demandaId}/evoluir-epico`, payload)
  return response.data
}

export async function evoluirParaDiscovery(demandaId: string) {
  const response = await api.post<{ discoveryId: string }>(
    `/triagem/demandas/${demandaId}/evoluir-discovery`,
  )
  return response.data
}

export interface TriagemEmLoteResult {
  sucesso: string[]
  falhas: Array<{ demandaId: string; erro: string }>
}

export async function triarDemandasEmLote(demandaIds: string[]): Promise<TriagemEmLoteResult> {
  const response = await api.post<TriagemEmLoteResult>('/triagem/demandas/triar-em-lote', {
    demandaIds,
  })
  return response.data
}

export async function triarDemanda(demandaId: string, payload: TriarDemandaPayload) {
  const response = await api.patch(`/triagem/demandas/${demandaId}/triar`, payload)
  return response.data
}

export async function solicitarInformacao(demandaId: string, payload: SolicitarInformacaoPayload) {
  const response = await api.post(`/triagem/demandas/${demandaId}/solicitar-informacao`, payload)
  return response.data
}

export async function marcarComoDuplicata(demandaId: string, payload: MarcarDuplicataPayload) {
  const response = await api.post(`/triagem/demandas/${demandaId}/marcar-duplicata`, payload)
  return response.data
}

export async function obterSinaisTriagem(demandaId: string) {
  const response = await api.get<{ sinais: TriagemSinal[] }>(
    `/triagem/demandas/${demandaId}/sinais`,
  )
  return response.data
}

export async function obterSugestoesTriagem(demandaId: string) {
  const response = await api.get<{ sugestoes: TriagemSugestao[] }>(
    `/triagem/demandas/${demandaId}/sugestoes`,
  )
  return response.data
}

export async function reatribuirPm(demandaId: string, novoPmId: string) {
  const response = await api.post(`/triagem/demandas/${demandaId}/reatribuir-pm`, { novoPmId })
  return response.data
}
