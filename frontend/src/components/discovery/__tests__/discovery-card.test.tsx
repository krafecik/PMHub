import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders, createMockRouter } from '@/__tests__/utils'
import { DiscoveryCard } from '../discovery-card'
import type { DiscoveryListItem } from '@/lib/discovery-api'

const baseDiscovery: DiscoveryListItem = {
  id: 'discovery-123456789',
  demandaId: 'demanda-01',
  titulo: 'Explorar dores no onboarding de PMs',
  descricao: 'Entender os principais gargalos ao iniciar novos PMs.',
  status: 'EM_PESQUISA',
  statusLabel: 'Em Pesquisa',
  produtoId: 'produto-01',
  produtoNome: 'Produto Insight',
  responsavelId: 'pm-01',
  responsavelNome: 'Maria Souza',
  qtdHipoteses: 5,
  qtdPesquisas: 3,
  qtdInsights: 8,
  qtdExperimentos: 2,
  tags: ['onboarding', 'pm', 'experiencia', 'flow'],
  createdAt: '2024-03-10T12:00:00.000Z',
  updatedAt: '2024-03-11T12:00:00.000Z',
}

describe('DiscoveryCard', () => {
  it('renderiza informações chave e limita tags adicionais', () => {
    renderWithProviders(<DiscoveryCard discovery={baseDiscovery} />)

    expect(
      screen.getByText(new RegExp(`Discovery #${baseDiscovery.id.slice(0, 8)}`, 'i')),
    ).toBeInTheDocument()
    expect(screen.getByText(baseDiscovery.titulo)).toBeInTheDocument()
    expect(screen.getByText(baseDiscovery.descricao)).toBeInTheDocument()
    expect(screen.getByText(`${baseDiscovery.qtdHipoteses}`)).toBeInTheDocument()
    expect(screen.getByText(`${baseDiscovery.qtdPesquisas}`)).toBeInTheDocument()
    expect(screen.getByText(`${baseDiscovery.qtdInsights}`)).toBeInTheDocument()
    expect(screen.getByText(`${baseDiscovery.qtdExperimentos}`)).toBeInTheDocument()
    expect(screen.getByText('onboarding')).toBeInTheDocument()
    expect(screen.getByText('pm')).toBeInTheDocument()
    expect(screen.getByText('experiencia')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText(baseDiscovery.statusLabel)).toBeInTheDocument()

    const expectedDate = new Date(baseDiscovery.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
    expect(screen.getByText(expectedDate, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(baseDiscovery.produtoNome!)).toBeInTheDocument()
    expect(screen.getByText(/PM: Maria Souza/)).toBeInTheDocument()
  })

  it('navega ao clicar nos botões de ação', () => {
    const push = vi.fn()
    const router = createMockRouter({ push })

    renderWithProviders(<DiscoveryCard discovery={baseDiscovery} />, {
      router,
    })

    fireEvent.click(screen.getByRole('button', { name: /visualizar/i }))
    fireEvent.click(screen.getByRole('button', { name: /abrir discovery/i }))

    expect(push).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledWith(`/discovery/${baseDiscovery.id}`)
  })

  it('usa fallback de status quando configuração não existe', () => {
    const push = vi.fn()
    const router = createMockRouter({ push })
    const customDiscovery: DiscoveryListItem = {
      ...baseDiscovery,
      status: 'STATUS_DESCONHECIDO',
      statusLabel: 'Personalizado',
    }

    renderWithProviders(<DiscoveryCard discovery={customDiscovery} />, {
      router,
    })

    expect(screen.getByText('Personalizado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /visualizar/i }))
    expect(push).toHaveBeenCalledWith(`/discovery/${customDiscovery.id}`)
  })
})
