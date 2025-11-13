'use client'

import { apiFetch } from './api-client'
import { AuthSession } from '@/store/auth-store'

type AzureLoginResponse = {
  authorizationUrl: string
  state: string
  expiresIn: number
}

export async function loginWithAzure(): Promise<AzureLoginResponse> {
  return apiFetch<AzureLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ provider: 'azuread' }),
  })
}

export async function loginWithCredentials(email: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ provider: 'local', email, password }),
  })
}

export async function completeAzureCallback(params: URLSearchParams): Promise<AuthSession> {
  const query = params.toString()
  return apiFetch<AuthSession>(`/auth/callback?${query}`, {
    method: 'GET',
    retry: false,
  })
}

export async function fetchTenants() {
  return apiFetch<Array<{ tenantId: string; nome?: string | null; role: string }>>('/tenants', {
    method: 'GET',
  })
}

export async function selectTenant(tenantId: string): Promise<AuthSession> {
  return apiFetch<AuthSession>('/tenants/select', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  })
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', {
    method: 'POST',
  })
}

export async function bootstrapSession(): Promise<AuthSession | null> {
  try {
    return await apiFetch<AuthSession>('/auth/refresh', {
      method: 'POST',
      retry: false,
    })
  } catch {
    return null
  }
}
