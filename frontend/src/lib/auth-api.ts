'use client'

import { apiFetch } from './api-client'
import { AuthSession } from '@/store/auth-store'

export type UserRoleAssignment = {
  tenantId: string
  nome?: string | null
  role: string
}

export type UserSummary = {
  id: string
  email: string
  nome: string
  status: 'ACTIVE' | 'INVITED' | 'LOCKED' | 'DISABLED' | 'DRAFT'
  provider: 'LOCAL' | 'AZURE_AD'
  lastLoginAt?: string | null
  lockedUntil?: string | null
  tenants: UserRoleAssignment[]
}

export type InviteSummary = {
  id: string
  email: string
  nome?: string | null
  tenantId: string
  tenantNome?: string | null
  role: string
  invitedBy: string
  invitedByNome?: string | null
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'expired' | 'accepted'
}

export type InviteValidation = {
  email: string
  nome?: string | null
  tenantId: string
  tenantNome?: string | null
  role: string
  expiresAt: string
}

export async function loginWithCredentials(email: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ provider: 'local', email, password }),
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

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
    retry: false,
  })
}

export async function resetPassword(payload: { token: string; password: string }): Promise<void> {
  await apiFetch('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(payload),
    retry: false,
  })
}

export async function validateInvite(token: string): Promise<InviteValidation> {
  const query = new URLSearchParams({ token })
  return apiFetch<InviteValidation>(`/auth/invite/validate?${query.toString()}`, {
    method: 'GET',
    retry: false,
  })
}

export async function acceptInvite(payload: {
  token: string
  nome: string
  password: string
}): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/invite/accept', {
    method: 'POST',
    body: JSON.stringify(payload),
    retry: false,
  })
}

export async function listUsers(params: { tenantId?: string } = {}): Promise<UserSummary[]> {
  const query = new URLSearchParams()
  if (params.tenantId) {
    query.set('tenantId', params.tenantId)
  }
  const path = query.toString() ? `/users?${query.toString()}` : '/users'
  return apiFetch<UserSummary[]>(path, {
    method: 'GET',
  })
}

export async function listPendingInvites(
  params: { tenantId?: string } = {},
): Promise<InviteSummary[]> {
  const query = new URLSearchParams()
  if (params.tenantId) {
    query.set('tenantId', params.tenantId)
  }
  const path = query.toString() ? `/users/invites?${query.toString()}` : '/users/invites'
  return apiFetch<InviteSummary[]>(path, {
    method: 'GET',
  })
}

export async function inviteUser(payload: {
  email: string
  nome: string
  tenantId: string
  role: string
  mensagem?: string
}): Promise<void> {
  await apiFetch('/users/invites', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function resendInvite(inviteId: string): Promise<void> {
  await apiFetch(`/users/invites/${inviteId}/resend`, {
    method: 'POST',
  })
}

export async function revokeInvite(inviteId: string): Promise<void> {
  await apiFetch(`/users/invites/${inviteId}`, {
    method: 'DELETE',
  })
}

export async function updateUserTenantRole(payload: {
  userId: string
  tenantId: string
  role: string
}): Promise<void> {
  await apiFetch(`/users/${payload.userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ tenantId: payload.tenantId, role: payload.role }),
  })
}

export async function unlockUserAccount(userId: string): Promise<void> {
  await apiFetch(`/users/${userId}/unlock`, {
    method: 'POST',
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
