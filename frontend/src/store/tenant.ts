import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Tenant {
  id: string
  nome: string
  slug?: string
}

interface TenantStore {
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant) => void
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set) => ({
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
    }),
    {
      name: 'tenant-storage',
    },
  ),
)
