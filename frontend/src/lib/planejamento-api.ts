'use client'

import { apiFetch } from './api-client'

export interface PlanejamentoEpico {
  id: string
  titulo: string
  descricao?: string
  objetivo?: string
  valueProposition?: string
  criteriosAceite?: string
  riscos?: string
  status: string
  health: string
  quarter: string
  squadId?: string
  ownerId: string
  sponsorId?: string
  progressPercent?: number
  startDate?: string
  endDate?: string
}

export interface ListarEpicosResponse {
  total: number
  data: PlanejamentoEpico[]
}

export interface PlanejamentoCapacity {
  id?: string
  tenantId: string
  squadId: string
  quarter: string
  capacidadeTotal: number
  capacidadeUsada: number
  bufferPercentual: number
}

export interface PlanejamentoScenario {
  id: string
  nome: string
  descricao?: string
  status: string
  statusSlug: string
  statusLabel: string
  statusId: string
  statusMetadata?: Record<string, unknown> | null
  quarter: string
  incluirContractors: boolean
  considerarFerias: boolean
  bufferRiscoPercentual: number
  resultado?: {
    cabemEpicos: string[]
    atrasadosEpicos: string[]
    comentarios?: string[]
  }
}

export type CommitmentTierItem = {
  epicoId: string
  titulo: string
  squadId?: string
  confianca?: string
}

export type PlanningCommitmentTier = {
  key: string
  id: string
  slug: string
  label: string
  metadata: Record<string, unknown> | null
  itens: CommitmentTierItem[]
}

export interface PlanningCommitment {
  id?: string
  tenantId?: string
  produtoId?: string
  planningCycleId?: string | null
  quarter: string
  documentoUrl?: string
  assinaturas: { papel: string; usuarioId: string; assinadoEm: string }[]
  tiers: PlanningCommitmentTier[]
  itens: {
    committed: CommitmentTierItem[]
    targeted: CommitmentTierItem[]
    aspirational: CommitmentTierItem[]
  }
  committed: CommitmentTierItem[]
  targeted: CommitmentTierItem[]
  aspirational: CommitmentTierItem[]
  createdAt?: string
  updatedAt?: string
}

export interface PlanningDashboardResponse {
  quarter: string
  planningCycle: PlanningCycle | null
  capacity: {
    total: number
    allocated: number
    utilization: number
    squads: PlanejamentoCapacity[]
  }
  epicos: ListarEpicosResponse
  commitment: PlanningCommitment | null
  insights?: string[]
}

export interface EpicoPrioridadeIa {
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'
  justificativa: string
  alertas: string[]
}

export interface EpicoHealthIa {
  health: 'GREEN' | 'YELLOW' | 'RED'
  justificativa: string
  proximosPassos: string[]
}

export interface DependenciaIaSugestao {
  idFeature: string
  tipo: 'HARD' | 'SOFT' | 'RECURSO'
  risco: 'ALTO' | 'MEDIO' | 'BAIXO'
  justificativa: string
}

export interface RoadmapDraftIa {
  committed: string[]
  targeted: string[]
  aspirational: string[]
  comentarios: string
  contextoAtual?: any
}

export async function listarEpicos(params: {
  quarter?: string
  produtoId?: string
  squadId?: string
  status?: string[]
  search?: string
}): Promise<ListarEpicosResponse> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item))
    } else {
      searchParams.append(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiFetch<ListarEpicosResponse>(`/planejamento/epicos${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

export async function obterEpico(epicoId: string): Promise<any> {
  return apiFetch(`/planejamento/epicos/${epicoId}`, { method: 'GET' })
}

export async function atualizarStatusEpico(
  epicoId: string,
  payload: { status: string; health?: string; progressPercent?: number },
): Promise<{ message: string }> {
  return apiFetch(`/planejamento/epicos/${epicoId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function sugerirPrioridadeEpicoIa(epicoId: string): Promise<EpicoPrioridadeIa> {
  return apiFetch(`/planejamento/epicos/${epicoId}/sugerir-prioridade`, {
    method: 'POST',
  })
}

export async function calcularHealthScoreEpicoIa(epicoId: string): Promise<EpicoHealthIa> {
  return apiFetch(`/planejamento/epicos/${epicoId}/calcular-health-score`, {
    method: 'POST',
  })
}

export async function criarOuAtualizarEpico(payload: {
  epicoId?: string
  produtoId: string
  planningCycleId?: string
  squadId?: string
  titulo: string
  descricao?: string
  objetivo?: string
  valueProposition?: string
  criteriosAceite?: string
  riscos?: string
  quarter: string
  ownerId: string
  sponsorId?: string
  status?: string
  health?: string
  progressPercent?: number
  startDate?: string
  endDate?: string
}): Promise<{ message: string; epicoId: string }> {
  return apiFetch('/planejamento/epicos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function criarOuAtualizarFeature(payload: {
  featureId?: string
  epicoId: string
  titulo: string
  descricao?: string
  squadId?: string
  pontos?: number
  status?: string
  riscos?: string
  criteriosAceite?: string
  dependenciasIds?: string[]
  revisadoPorId?: string
}): Promise<{ message: string; featureId: string }> {
  return apiFetch('/planejamento/features', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface PlanejamentoFeature {
  id: string
  titulo: string
  descricao?: string
  epicoId: string
  squadId?: string
  pontos?: number
  status: string
  riscos?: string
  criteriosAceite?: string
  dependenciasIds?: string[]
  revisadoPorId?: string
  createdAt?: string
  updatedAt?: string
}

export interface ListarFeaturesResponse {
  total: number
  data: PlanejamentoFeature[]
}

export async function listarFeatures(params: {
  epicoId?: string
  squadId?: string
  quarter?: string
  status?: string[]
  search?: string
  page?: number
  pageSize?: number
}): Promise<ListarFeaturesResponse> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item))
    } else {
      searchParams.append(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiFetch<ListarFeaturesResponse>(`/planejamento/features${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

export async function obterFeature(featureId: string): Promise<PlanejamentoFeature> {
  return apiFetch(`/planejamento/features/${featureId}`, { method: 'GET' })
}

export async function sugerirDependenciasIa(
  featureId: string,
): Promise<{ dependenciasSugeridas: DependenciaIaSugestao[] }> {
  return apiFetch(`/planejamento/features/${featureId}/sugerir-dependencias`, {
    method: 'POST',
  })
}

export async function atualizarStatusFeature(
  featureId: string,
  payload: { status: string },
): Promise<{ message: string }> {
  return apiFetch(`/planejamento/features/${featureId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function fetchPlanningDashboard(params: {
  quarter: string
  produtoId?: string
}): Promise<PlanningDashboardResponse> {
  const searchParams = new URLSearchParams()
  searchParams.append('quarter', params.quarter)
  if (params.produtoId) searchParams.append('produtoId', params.produtoId)

  return apiFetch(`/planejamento/dashboard?${searchParams.toString()}`, {
    method: 'GET',
  })
}

export async function fetchTimeline(quarter: string): Promise<Record<string, any>> {
  return apiFetch(`/planejamento/timeline?quarter=${quarter}`, {
    method: 'GET',
  })
}

export async function gerarRoadmapDraftIa(payload: { quarter: string }): Promise<RoadmapDraftIa> {
  return apiFetch('/planejamento/roadmap/gerar-draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchCapacidade(quarter: string): Promise<PlanejamentoCapacity[]> {
  return apiFetch(`/planejamento/capacidade?quarter=${quarter}`, {
    method: 'GET',
  })
}

export async function fetchCenarios(quarter: string): Promise<PlanejamentoScenario[]> {
  return apiFetch(`/planejamento/cenarios?quarter=${quarter}`, {
    method: 'GET',
  })
}

export async function salvarCommitment(payload: {
  produtoId?: string
  quarter: string
  planningCycleId?: string
  documentoUrl?: string
  committed: CommitmentTierItem[]
  targeted: CommitmentTierItem[]
  aspirational: CommitmentTierItem[]
  assinaturas?: Array<{ papel: string; usuarioId: string; assinadoEm: string }>
}): Promise<{ message: string }> {
  return apiFetch('/planejamento/commitments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function recalcularCenario(cenarioId: string): Promise<{ message: string }> {
  return apiFetch(`/planejamento/cenarios/${cenarioId}/recalcular`, {
    method: 'POST',
  })
}

export async function salvarCenario(payload: {
  cenarioId?: string
  planningCycleId?: string
  nome: string
  descricao?: string
  quarter: string
  statusSlug?: string
  incluirContractors?: boolean
  considerarFerias?: boolean
  bufferRiscoPercentual?: number
  ajustesCapacidade?: Array<{ squadId: string; deltaPercentual: number }>
}): Promise<{ message: string; cenarioId: string }> {
  return apiFetch('/planejamento/cenarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface PlanejamentoSquad {
  id: string
  nome: string
  slug: string
  status: string
  statusSlug: string
  statusLabel: string
  statusId: string
  statusMetadata?: Record<string, unknown> | null
  produtoId?: string
  descricao?: string
  corToken?: string
  timezone?: string
  capacidadePadrao?: number
}

export async function listarSquads(): Promise<PlanejamentoSquad[]> {
  return apiFetch('/planejamento/squads', { method: 'GET' })
}

export async function salvarSquad(
  payload: Partial<PlanejamentoSquad> & { nome: string; slug?: string },
  squadId?: string,
): Promise<{ message: string; squadId: string }> {
  const body = JSON.stringify(payload)
  if (squadId) {
    return apiFetch(`/planejamento/squads/${squadId}`, {
      method: 'PATCH',
      body,
    })
  }
  return apiFetch('/planejamento/squads', {
    method: 'POST',
    body,
  })
}

export async function removerSquad(squadId: string): Promise<{ message: string }> {
  return apiFetch(`/planejamento/squads/${squadId}`, {
    method: 'DELETE',
  })
}

export interface PlanningCycle {
  id: string
  tenantId?: string
  produtoId?: string
  quarter: string
  status: string
  statusSlug: string
  statusLabel: string
  statusId: string
  statusMetadata?: Record<string, unknown> | null
  faseAtual: number
  checklist: Array<{ chave: string; label: string; concluido: boolean; responsavel?: string }>
  agendaUrl?: string
  participantesConfirmados?: number
  participantesTotais?: number
  dadosPreparacao?: Record<string, unknown>
  iniciadoEm?: string
  finalizadoEm?: string
  createdAt?: string
  updatedAt?: string
}

export async function listarPlanningCycles(params?: {
  quarter?: string
  produtoId?: string
}): Promise<PlanningCycle[]> {
  const searchParams = new URLSearchParams()
  if (params?.quarter) searchParams.append('quarter', params.quarter)
  if (params?.produtoId) searchParams.append('produtoId', params.produtoId)
  const query = searchParams.toString()
  return apiFetch(`/planejamento/cycles${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

export async function criarPlanningCycle(payload: {
  produtoId?: string
  quarter: string
  checklist?: PlanningCycle['checklist']
  agendaUrl?: string
  participantesConfirmados?: number
  participantesTotais?: number
  dadosPreparacao?: Record<string, unknown>
}): Promise<{ message: string; cycleId: string }> {
  return apiFetch('/planejamento/cycles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function obterPlanningCycle(cycleId: string): Promise<PlanningCycle> {
  return apiFetch(`/planejamento/cycles/${cycleId}`, { method: 'GET' })
}

export async function atualizarPlanningCycle(
  cycleId: string,
  payload: Partial<{
    statusSlug: string
    faseAtual: number
    checklist: PlanningCycle['checklist']
    participantesConfirmados: number
    participantesTotais: number
    agendaUrl: string
    dadosPreparacao: Record<string, unknown>
  }>,
): Promise<{ message: string }> {
  return apiFetch(`/planejamento/cycles/${cycleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function removerPlanningCycle(cycleId: string): Promise<{ message: string }> {
  return apiFetch(`/planejamento/cycles/${cycleId}`, {
    method: 'DELETE',
  })
}

export interface PlanejamentoDependencia {
  id: string
  featureBloqueadaId: string
  featureBloqueadoraId: string
  tipo: string
  risco: string
  nota?: string
  createdAt?: string
  updatedAt?: string
}

export async function listarTodasDependencias(params?: {
  featureId?: string
  epicoId?: string
  quarter?: string
}): Promise<PlanejamentoDependencia[]> {
  const searchParams = new URLSearchParams()
  if (params?.featureId) searchParams.append('featureId', params.featureId)
  if (params?.epicoId) searchParams.append('epicoId', params.epicoId)
  if (params?.quarter) searchParams.append('quarter', params.quarter)
  const query = searchParams.toString()
  return apiFetch(`/planejamento/dependencias${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

export async function registrarDependencia(payload: {
  dependenciaId?: string
  featureBloqueadaId: string
  featureBloqueadoraId: string
  tipo: string
  risco: string
  nota?: string
}): Promise<{ message: string }> {
  return apiFetch('/planejamento/dependencias', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function removerDependencia(dependenciaId: string): Promise<{ message: string }> {
  return apiFetch(`/planejamento/dependencias/${dependenciaId}`, {
    method: 'DELETE',
  })
}

export interface PlanejamentoCommitmentDetalhe {
  id: string
  tenantId: string
  produtoId: string
  planningCycleId?: string
  quarter: string
  tiers: {
    committed: { id: string; nome: string }
    targeted: { id: string; nome: string }
    aspirational: { id: string; nome: string }
  }
  itens: {
    committed: CommitmentTierItem[]
    targeted: CommitmentTierItem[]
    aspirational: CommitmentTierItem[]
  }
  assinaturas?: Array<{ papel: string; usuarioId: string; assinadoEm: string }>
  documentoUrl?: string
  createdAt?: string
  updatedAt?: string
}

export async function listarCommitments(params?: {
  produtoId?: string
  quarter?: string
  planningCycleId?: string
}): Promise<PlanejamentoCommitmentDetalhe[]> {
  const searchParams = new URLSearchParams()
  if (params?.produtoId) searchParams.append('produtoId', params.produtoId)
  if (params?.quarter) searchParams.append('quarter', params.quarter)
  if (params?.planningCycleId) searchParams.append('planningCycleId', params.planningCycleId)
  const query = searchParams.toString()
  return apiFetch(`/planejamento/commitments${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

export async function obterCommitmentDetalhe(
  commitmentId: string,
): Promise<PlanejamentoCommitmentDetalhe> {
  return apiFetch(`/planejamento/commitments/${commitmentId}`, { method: 'GET' })
}
