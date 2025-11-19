import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '@/__tests__/utils'
import {
  useListarDiscoveries,
  useInsightsRelacionados,
  useCriarDiscovery,
  useAtualizarDiscovery,
} from '../use-discovery'
import type {
  ListarDiscoveriesParams,
  AtualizarDiscoveryData,
  CriarDiscoveryData,
} from '@/lib/discovery-api'

const discoveryApiMocks = vi.hoisted(() => ({
  listarDiscoveries: vi.fn(),
  obterEstatisticasDiscovery: vi.fn(),
  buscarInsightsRelacionados: vi.fn(),
  obterDiscoveryCompleto: vi.fn(),
  obterEntrevistaDetalhe: vi.fn(),
  criarDiscovery: vi.fn(),
  atualizarDiscovery: vi.fn(),
  criarHipotese: vi.fn(),
  registrarPesquisa: vi.fn(),
  adicionarEntrevista: vi.fn(),
  criarEvidencia: vi.fn(),
  gerarInsight: vi.fn(),
  iniciarExperimento: vi.fn(),
  finalizarDiscovery: vi.fn(),
  atualizarStatusHipotese: vi.fn(),
  concluirExperimento: vi.fn(),
}))

vi.mock('@/lib/discovery-api', () => discoveryApiMocks)

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: toastMocks,
}))

const renderWithClient = (hook: () => unknown, queryClient = createTestQueryClient()) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const rendered = renderHook(hook, { wrapper })
  return { ...rendered, queryClient }
}

describe('useListarDiscoveries', () => {
  beforeEach(() => {
    discoveryApiMocks.listarDiscoveries.mockReset()
  })

  it('busca discoveries com os parâmetros informados', async () => {
    const params: ListarDiscoveriesParams = { page: 1, pageSize: 20 }
    const response = { items: [{ id: 'disc-1' }], total: 1 }
    discoveryApiMocks.listarDiscoveries.mockResolvedValueOnce(response)

    const { result, queryClient } = renderWithClient(() => useListarDiscoveries(params))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(discoveryApiMocks.listarDiscoveries).toHaveBeenCalledWith(params)
    expect(result.current.data).toEqual(response)

    queryClient.clear()
  })
})

describe('useInsightsRelacionados', () => {
  beforeEach(() => {
    discoveryApiMocks.buscarInsightsRelacionados.mockReset()
  })

  it('mantém a query desabilitada quando não há tags', () => {
    const { result, queryClient } = renderWithClient(() => useInsightsRelacionados([]))

    expect(result.current.fetchStatus).toBe('idle')
    expect(discoveryApiMocks.buscarInsightsRelacionados).not.toHaveBeenCalled()

    queryClient.clear()
  })

  it('busca insights relacionados quando tags estão presentes', async () => {
    const response = [{ id: 'insight-1' }]
    discoveryApiMocks.buscarInsightsRelacionados.mockResolvedValueOnce(response)

    const { result, queryClient } = renderWithClient(() =>
      useInsightsRelacionados(['impacto'], 'disc-1', 5),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(discoveryApiMocks.buscarInsightsRelacionados).toHaveBeenCalledWith(
      ['impacto'],
      'disc-1',
      5,
    )
    expect(result.current.data).toEqual(response)

    queryClient.clear()
  })
})

describe('mutations de discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useCriarDiscovery invalida queries e exibe toast de sucesso', async () => {
    const payload: CriarDiscoveryData = {
      demandaId: '1',
      titulo: 'Nova discovery',
      descricao: 'Descrição',
      responsavelId: 'pm-1',
      produtoId: 'produto-1',
    }
    discoveryApiMocks.criarDiscovery.mockResolvedValueOnce({ id: 'new' })

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderWithClient(() => useCriarDiscovery(), queryClient)

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(discoveryApiMocks.criarDiscovery).toHaveBeenCalledWith(payload)
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['discoveries', 'list'] }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['discoveries', 'stats'] }),
    )
    expect(toastMocks.success).toHaveBeenCalledWith('Discovery criado com sucesso!')

    queryClient.clear()
  })

  it('useAtualizarDiscovery exibe erro quando a mutação falha', async () => {
    const payload: AtualizarDiscoveryData = { titulo: 'Atualizado' }
    const error = new Error('falha')
    discoveryApiMocks.atualizarDiscovery.mockRejectedValueOnce(error)

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderWithClient(() => useAtualizarDiscovery('disc-1'), queryClient)

    await act(async () => {
      await expect(result.current.mutateAsync(payload)).rejects.toThrow(error)
    })

    expect(discoveryApiMocks.atualizarDiscovery).toHaveBeenCalledWith('disc-1', payload)
    expect(invalidateSpy).not.toHaveBeenCalled()
    expect(toastMocks.error).toHaveBeenCalledWith('Erro ao atualizar discovery')

    queryClient.clear()
  })
})
