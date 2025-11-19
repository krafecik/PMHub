import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

type DiscoverySearchContextValue = {
  globalSearchTerm: string
  setGlobalSearchTerm: (value: string) => void
}

const DiscoverySearchContext = createContext<DiscoverySearchContextValue | undefined>(undefined)

type DiscoverySearchProviderProps = {
  children: ReactNode
}

export function DiscoverySearchProvider({ children }: DiscoverySearchProviderProps) {
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')

  const value = useMemo(
    () => ({
      globalSearchTerm,
      setGlobalSearchTerm,
    }),
    [globalSearchTerm],
  )

  return <DiscoverySearchContext.Provider value={value}>{children}</DiscoverySearchContext.Provider>
}

export function useDiscoverySearch() {
  const context = useContext(DiscoverySearchContext)
  if (!context) {
    throw new Error('useDiscoverySearch deve ser usado dentro de DiscoverySearchProvider')
  }
  return context
}
