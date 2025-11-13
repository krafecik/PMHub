'use client'

import { apiFetch } from './api-client'
import { TipoDemanda, OrigemDemanda, Prioridade, StatusDemanda } from './enums'

export interface CriarDemandaRapidaPayload {
  titulo: string
  tipo: TipoDemanda
  produtoId: string
  descricao?: string
  origem?: OrigemDemanda
  origemDetalhe?: string
}

export interface DemandaListItem {
  id: string
  titulo: string
  tipo: string
  tipoLabel: string
  produtoId: string
  origem: string
  origemLabel: string
  prioridade: string
  prioridadeLabel: string
  prioridadeColor: string
  status: string
  statusLabel: string
  responsavelId?: string
  criadoPorId: string
  createdAt: string
  updatedAt: string
}

export interface ListarDemandasParams {
  status?: StatusDemanda[]
  tipo?: TipoDemanda[]
  produtoId?: string
  responsavelId?: string
  origem?: OrigemDemanda[]
  prioridade?: Prioridade[]
  search?: string
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface ListarDemandasResponse {
  data: DemandaListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function criarDemandaRapida(
  payload: CriarDemandaRapidaPayload,
): Promise<{ id: string; message: string }> {
  return apiFetch<{ id: string; message: string }>('/v1/demandas/rapida', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listarDemandas(
  params?: ListarDemandasParams,
): Promise<ListarDemandasResponse> {
  const searchParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
  }

  const queryString = searchParams.toString()
  const url = queryString ? `/v1/demandas?${queryString}` : '/v1/demandas'

  return apiFetch<ListarDemandasResponse>(url, {
    method: 'GET',
  })
}

export interface DemandaDetalhada {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  tipoLabel: string
  produtoId: string
  origem: string
  origemLabel: string
  origemDetalhe?: string
  responsavelId?: string
  prioridade: string
  prioridadeLabel: string
  prioridadeColor: string
  status: string
  statusLabel: string
  criadoPorId: string
  createdAt: string
  updatedAt: string
}

export async function buscarDemandaPorId(id: string): Promise<DemandaDetalhada> {
  return apiFetch<DemandaDetalhada>(`/v1/demandas/${id}`, {
    method: 'GET',
  })
}

export interface ComentarioListItem {
  id: string
  demandaId: string
  usuarioId: string
  texto: string
  createdAt: string
  updatedAt: string
  foiEditado: boolean
}

export async function adicionarComentario(
  demandaId: string,
  texto: string,
): Promise<{ id: string; message: string }> {
  return apiFetch<{ id: string; message: string }>(`/v1/demandas/${demandaId}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ texto }),
  })
}

export async function listarComentarios(demandaId: string): Promise<ComentarioListItem[]> {
  return apiFetch<ComentarioListItem[]>(`/v1/demandas/${demandaId}/comentarios`, {
    method: 'GET',
  })
}

export interface AtualizarDemandaPayload {
  titulo?: string
  descricao?: string
  tipo?: TipoDemanda
  origem?: OrigemDemanda
  origemDetalhe?: string
  prioridade?: Prioridade
  responsavelId?: string | null
  status?: StatusDemanda
}

export async function atualizarDemanda(
  id: string,
  payload: AtualizarDemandaPayload,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/v1/demandas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
