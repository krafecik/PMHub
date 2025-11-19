'use client'

import { apiFetch } from './api-client'
import type { TipoDemanda, OrigemDemanda, Prioridade, StatusDemanda } from './enums'

export interface CriarDemandaRapidaPayload {
  titulo: string
  tipo: TipoDemanda | string
  produtoId: string
  descricao?: string
  origem?: OrigemDemanda | string
  origemDetalhe?: string
  prioridade?: Prioridade | string
  status?: StatusDemanda | string
  responsavelId?: string
}

export interface DemandaListItem {
  id: string
  titulo: string
  tipo: string
  tipoLabel: string
  produtoId: string
  produtoNome: string
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
  comentariosCount?: number
  anexosCount?: number
}

export interface ListarDemandasParams {
  status?: (StatusDemanda | string)[]
  tipo?: (TipoDemanda | string)[]
  produtoId?: string
  responsavelId?: string
  origem?: (OrigemDemanda | string)[]
  prioridade?: (Prioridade | string)[]
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
  return apiFetch<{ id: string; message: string }>('/demandas/rapida', {
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
  const url = queryString ? `/demandas?${queryString}` : '/demandas'

  return apiFetch<ListarDemandasResponse>(url, {
    method: 'GET',
  })
}

export interface TagDto {
  id: string
  nome: string
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
  criadoPorNome?: string
  motivoCancelamento?: string
  tags: TagDto[]
  createdAt: string
  updatedAt: string
}

export async function buscarDemandaPorId(id: string): Promise<DemandaDetalhada> {
  return apiFetch<DemandaDetalhada>(`/demandas/${id}`, {
    method: 'GET',
  })
}

export interface ComentarioListItem {
  id: string
  demandaId: string
  usuarioId: string
  usuarioNome?: string
  texto: string
  createdAt: string
  updatedAt: string
  foiEditado: boolean
}

export async function adicionarComentario(
  demandaId: string,
  texto: string,
): Promise<{ id: string; message: string }> {
  return apiFetch<{ id: string; message: string }>(`/demandas/${demandaId}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ texto }),
  })
}

export async function listarComentarios(demandaId: string): Promise<ComentarioListItem[]> {
  return apiFetch<ComentarioListItem[]>(`/demandas/${demandaId}/comentarios`, {
    method: 'GET',
  })
}

export interface AtualizarDemandaPayload {
  titulo?: string
  descricao?: string
  tipo?: TipoDemanda | string
  origem?: OrigemDemanda | string
  origemDetalhe?: string
  prioridade?: Prioridade | string
  responsavelId?: string | null
  status?: StatusDemanda | string
}

export async function atualizarDemanda(
  id: string,
  payload: AtualizarDemandaPayload,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/demandas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function adicionarTag(
  demandaId: string,
  tagNome: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/demandas/${demandaId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tagNome }),
  })
}

export async function removerTag(demandaId: string, tagId: string): Promise<void> {
  return apiFetch<void>(`/demandas/${demandaId}/tags/${tagId}`, {
    method: 'DELETE',
  })
}

export async function cancelarDemanda(
  demandaId: string,
  motivoCancelamento: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/demandas/${demandaId}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivoCancelamento }),
  })
}
