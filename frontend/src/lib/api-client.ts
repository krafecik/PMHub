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
  const { setSession, clearSession, currentTenantId } = useAuthStore.getState()

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (currentTenantId) {
      headers['X-Tenant-Id'] = currentTenantId
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      // Se o refresh falhou, limpar sessão silenciosamente
      clearSession()
      return null
    }

    const data = await response.json()
    setSession(data)
    return data
  } catch (error) {
    // Erro de rede ou outro erro - limpar sessão silenciosamente
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
      // Se o refresh falhou, redirecionar para login sem mostrar erro no console
      window.location.href = '/login'
      return Promise.reject(new Error('Sessão expirada'))
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

    try {
      const errorBody = await parseResponse<{ message?: string; error?: string }>(
        response as Response,
      )
      const errorMessage =
        errorBody.message || errorBody.error || `Erro ${response.status}: ${response.statusText}`
      throw new Error(errorMessage)
    } catch (error) {
      // Se já é um Error, re-lançar
      if (error instanceof Error) {
        throw error
      }
      // Caso contrário, criar um novo erro com informações do status
      throw new Error(`Erro ${response.status}: ${response.statusText}`)
    }
  }

  return parseResponse<T>(response)
}
