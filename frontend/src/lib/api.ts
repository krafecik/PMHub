import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3055/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token e tenantId
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Adicionar tenantId do auth store
  const tenantId = useAuthStore.getState().currentTenantId
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId
  }

  return config
})

// Interceptor para lidar com erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const tenantId = useAuthStore.getState().currentTenantId

        // Usar fetch diretamente para ter controle sobre cookies
        const refreshHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (tenantId) {
          refreshHeaders['X-Tenant-Id'] = tenantId
        }

        // Tentar usar cookie primeiro, se não houver, usar body
        const refreshBody = {}

        // baseURL já inclui /v1, então não precisa adicionar /v1 novamente
        const baseUrl = api.defaults.baseURL || 'http://localhost:3055/v1'
        const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: refreshHeaders,
          credentials: 'include',
          body: JSON.stringify(refreshBody),
        })

        if (!refreshResponse.ok) {
          // Se o refresh falhou (401), limpar sessão e redirecionar
          useAuthStore.getState().clearSession()
          localStorage.removeItem('accessToken')
          window.location.href = '/login'
          return Promise.reject(new Error('Sessão expirada'))
        }

        const sessionData = await refreshResponse.json()

        // Atualizar tokens no localStorage e no store
        const { tokens, user, defaultTenantId } = sessionData
        if (tokens?.accessToken) {
          localStorage.setItem('accessToken', tokens.accessToken)

          // Atualizar o auth store
          useAuthStore.getState().setSession({
            user,
            tokens,
            defaultTenantId,
          })

          // Atualizar headers da requisição original
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
          if (tenantId && !originalRequest.headers['X-Tenant-Id']) {
            originalRequest.headers['X-Tenant-Id'] = tenantId
          }
        }

        return api(originalRequest)
      } catch (err) {
        // Limpar sessão e redirecionar para login
        useAuthStore.getState().clearSession()
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  },
)
