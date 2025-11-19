import { api } from './api'

export interface RegraListItem {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  ordem: number
  qtdCondicoes: number
  qtdAcoes: number
  criadoPor: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface CondicaoRegra {
  campoId: string
  campoSlug: string
  campoLabel: string
  campoMetadata: Record<string, unknown> | null
  operadorId: string
  operadorSlug: string
  operadorLabel: string
  operadorMetadata: Record<string, unknown> | null
  valor?: any
  logica: 'E' | 'OU'
}

export interface AcaoRegra {
  tipoId: string
  tipoSlug: string
  tipoLabel: string
  tipoMetadata: Record<string, unknown> | null
  campoId?: string
  campoSlug?: string
  campoLabel?: string
  campoMetadata?: Record<string, unknown> | null
  valor?: any
  configuracao?: Record<string, any>
}

export interface RegraDetalhada {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  ordem: number
  condicoes: CondicaoRegra[]
  acoes: AcaoRegra[]
  criadoPor: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface CondicaoRegraInput {
  campoId: string
  operadorId: string
  valor?: any
  logica?: 'E' | 'OU'
}

export interface AcaoRegraInput {
  tipoId: string
  campoId?: string
  valor?: any
  configuracao?: Record<string, any>
}

export interface CriarRegraPayload {
  nome: string
  descricao?: string
  condicoes: CondicaoRegraInput[]
  acoes: AcaoRegraInput[]
  ativo?: boolean
  ordem?: number
}

export interface AtualizarRegraPayload {
  nome?: string
  descricao?: string
  condicoes?: CondicaoRegraInput[]
  acoes?: AcaoRegraInput[]
  ordem?: number
}

export async function listarRegras(apenasAtivas?: boolean) {
  const params = apenasAtivas ? '?apenas_ativas=true' : ''
  const response = await api.get<{ success: boolean; data: RegraListItem[] }>(
    `/automacao/regras${params}`,
  )
  return response.data.data
}

export async function obterRegra(id: string) {
  const response = await api.get<{ success: boolean; data: RegraDetalhada }>(
    `/automacao/regras/${id}`,
  )
  return response.data.data
}

export async function criarRegra(payload: CriarRegraPayload) {
  const response = await api.post<{ success: boolean; data: { id: string } }>(
    '/automacao/regras',
    payload,
  )
  return response.data.data
}

export async function atualizarRegra(id: string, payload: AtualizarRegraPayload) {
  const response = await api.put(`/automacao/regras/${id}`, payload)
  return response.data
}

export async function alternarStatusRegra(id: string, ativo: boolean) {
  const response = await api.patch(`/automacao/regras/${id}/status`, { ativo })
  return response.data
}

export async function deletarRegra(id: string) {
  const response = await api.delete(`/automacao/regras/${id}`)
  return response.data
}
