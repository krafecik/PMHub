'use client'

import { useAuthStore } from '@/store/auth-store'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3055/v1'

type RequestOptions = RequestInit & {
  retry?: boolean
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T
  }

  const text = await response.text()

  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch (error) {
    throw new Error('Erro ao interpretar a resposta da API.')
  }
}

async function refreshSession() {
  const { setSession, clearSession } = useAuthStore.getState()

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      clearSession()
      return null
    }

    const data = await response.json()
    setSession(data)
    return data
  } catch (error) {
    clearSession()
    return null
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, currentTenantId, clearSession, setSession } = useAuthStore.getState()
  const { retry = true, ...fetchOptions } = options

  const headers = new Headers(fetchOptions.headers)

  if (!(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (currentTenantId) {
    headers.set('X-Tenant-Id', currentTenantId)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && retry) {
    const session = await refreshSession()

    if (!session) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    const retryHeaders = new Headers(fetchOptions.headers)
    retryHeaders.set('Authorization', `Bearer ${session.tokens.accessToken}`)
    if (currentTenantId) {
      retryHeaders.set('X-Tenant-Id', currentTenantId)
    }

    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: retryHeaders,
      credentials: 'include',
    })

    if (!retryResponse.ok) {
      clearSession()
      throw new Error('Erro ao tentar novamente a requisição.')
    }

    const data = await parseResponse<T>(retryResponse)
    setSession(session)
    return data
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Permissão insuficiente para executar esta ação.')
    }

    const errorBody = await parseResponse<{ message?: string }>(response as Response)
    throw new Error(errorBody.message ?? 'Erro inesperado na API.')
  }

  return parseResponse<T>(response)
}
