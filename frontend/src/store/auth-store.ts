'use client'

import { create } from 'zustand'

export type TenantInfo = {
  id: string
  nome?: string | null
  role: string
}

export type AuthUser = {
  id: string
  email: string
  nome: string
  foto_url?: string | null
  tenants: TenantInfo[]
}

export type AuthTokens = {
  accessToken: string
  expiresIn: number
  refreshToken: string
}

export type AuthSession = {
  user: AuthUser
  tokens: AuthTokens
  defaultTenantId: string | null
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  currentTenantId: string | null
  tokenExpiresAt: number | null
  isInitializing: boolean
  setSession: (session: AuthSession) => void
  clearSession: () => void
  setInitializing: (value: boolean) => void
  setCurrentTenant: (tenantId: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  currentTenantId: null,
  tokenExpiresAt: null,
  isInitializing: true,
  setSession: (session) =>
    set(() => ({
      user: session.user,
      accessToken: session.tokens.accessToken,
      currentTenantId: session.defaultTenantId ?? session.user.tenants[0]?.id ?? null,
      tokenExpiresAt: Date.now() + session.tokens.expiresIn * 1000,
      isInitializing: false,
    })),
  clearSession: () =>
    set(() => ({
      user: null,
      accessToken: null,
      currentTenantId: null,
      tokenExpiresAt: null,
      isInitializing: false,
    })),
  setInitializing: (value) =>
    set(() => ({
      isInitializing: value,
    })),
  setCurrentTenant: (tenantId) =>
    set((state) => ({
      currentTenantId: tenantId,
      user: state.user
        ? {
            ...state.user,
          }
        : null,
    })),
}))
