'use client'

import { apiFetch } from './api-client'

export type Produto = {
  id: string
  tenant_id: string
  nome: string
  descricao: string | null
  status: string
  created_at: string
  updated_at: string
}

export async function fetchProdutos(): Promise<Produto[]> {
  return apiFetch<Produto[]>('/produtos', {
    method: 'GET',
  })
}

export async function createProduto(payload: {
  nome: string
  descricao?: string | null
  status?: string
}): Promise<Produto> {
  return apiFetch<Produto>('/produtos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProduto(
  id: string,
  payload: { nome?: string; descricao?: string | null; status?: string },
): Promise<Produto> {
  return apiFetch<Produto>(`/produtos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteProduto(id: string): Promise<void> {
  await apiFetch(`/produtos/${id}`, {
    method: 'DELETE',
  })
}
