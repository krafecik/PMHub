import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils'
import { EpicsBoard } from '../epics-board'
import type { PlanejamentoEpico } from '@/lib/planejamento-api'

const makeEpico = (overrides: Partial<PlanejamentoEpico> = {}): PlanejamentoEpico => ({
  id: 'epico-01',
  titulo: 'Implementar onboarding gamificado',
  descricao: 'Criar experiência gamificada para novos PMs reduzirem curva de ramp-up.',
  status: 'IN_PROGRESS',
  health: 'YELLOW',
  quarter: 'Q2-2024',
  squadId: 'squad-alpha',
  ownerId: 'pm-01',
  progressPercent: 55,
  ...overrides,
})

describe('EpicsBoard', () => {
  it('exibe estado vazio quando não há épicos', () => {
    renderWithProviders(<EpicsBoard epicos={[]} />)

    expect(screen.getByText(/Nenhum épico planejado para este quarter/i)).toBeInTheDocument()
  })

  it('renderiza informações principais de cada épico e dispara seleção', () => {
    const onSelect = vi.fn()
    const epicos = [
      makeEpico(),
      makeEpico({
        id: 'epico-02',
        titulo: 'Discovery de monetização',
        descricao: 'Explorar novos modelos de receita com clientes enterprise.',
        status: 'PLANNED',
        health: 'GREEN',
        quarter: 'Q3-2024',
        squadId: 'squad-beta',
        progressPercent: 0,
      }),
    ]

    renderWithProviders(<EpicsBoard epicos={epicos} onSelect={onSelect} />)

    expect(screen.getByText('Q2-2024')).toBeInTheDocument()
    expect(screen.getByText('Q3-2024')).toBeInTheDocument()
    expect(screen.getByText('Implementar onboarding gamificado')).toBeInTheDocument()
    expect(screen.getByText('Discovery de monetização')).toBeInTheDocument()
    expect(screen.getAllByText(/Health/i)).toHaveLength(2)
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
    expect(screen.getByText('PLANNED')).toBeInTheDocument()
    expect(screen.getByText(/Squad squad-alpha/i)).toBeInTheDocument()
    expect(screen.getByText(/Squad squad-beta/i)).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Implementar onboarding gamificado'))
    expect(onSelect).toHaveBeenCalledWith('epico-01')
  })

  it('usa estados padrão quando informação opcional não existe', () => {
    const onSelect = vi.fn()
    const epico = makeEpico({
      id: 'epico-03',
      squadId: undefined,
      progressPercent: undefined,
    })

    renderWithProviders(<EpicsBoard epicos={[epico]} onSelect={onSelect} />)

    expect(screen.getByText(/Squad não definido/i)).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
