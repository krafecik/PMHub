import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useListarDemandas } from '../use-demandas'
import { createTestQueryClient } from '@/__tests__/utils'
import type { ListarDemandasParams } from '@/lib/demandas-api'
import { listarDemandas } from '@/lib/demandas-api'

vi.mock('@/lib/demandas-api', () => ({
  listarDemandas: vi.fn(),
}))

const mockedListarDemandas = listarDemandas as unknown as vi.Mock

describe('useListarDemandas', () => {
  beforeEach(() => {
    mockedListarDemandas.mockReset()
  })

  it('busca as demandas com os parâmetros fornecidos', async () => {
    const response = { items: [{ id: '1', titulo: 'Nova demanda' }], total: 1 }
    const params: ListarDemandasParams = { page: 2, pageSize: 10 }
    mockedListarDemandas.mockResolvedValueOnce(response)

    const queryClient = createTestQueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useListarDemandas(params), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedListarDemandas).toHaveBeenCalledWith(params)
    expect(result.current.data).toEqual(response)

    queryClient.clear()
  })

  it('utiliza parâmetros vazios como padrão', async () => {
    const response = { items: [], total: 0 }
    mockedListarDemandas.mockResolvedValueOnce(response)

    const queryClient = createTestQueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useListarDemandas(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedListarDemandas).toHaveBeenCalledWith({})
    expect(result.current.data).toEqual(response)

    queryClient.clear()
  })
})
