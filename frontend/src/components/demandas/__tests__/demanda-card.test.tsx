import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DemandaCard, type DemandaCardProps } from '../demanda-card'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => {
      const sanitizedProps = { ...rest }
      delete sanitizedProps.whileHover
      delete sanitizedProps.transition
      return <div {...sanitizedProps}>{children}</div>
    },
  },
}))

vi.mock('@radix-ui/react-dropdown-menu', () => {
  const createComponent = (displayName: string) => {
    const Component = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Component.displayName = displayName
    return Component
  }

  const Item = ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <div onClick={onSelect}>{children}</div>
  )
  Item.displayName = 'MockDropdownItem'

  return {
    Root: createComponent('MockDropdownRoot'),
    Trigger: createComponent('MockDropdownTrigger'),
    Content: createComponent('MockDropdownContent'),
    Portal: createComponent('MockDropdownPortal'),
    Separator: () => <div data-testid="dropdown-separator" />,
    Item,
  }
})

const demandaBase: DemandaCardProps['demanda'] = {
  id: '1',
  titulo: 'Melhoria na jornada de onboarding',
  descricao: 'Permite configurar passos dinâmicos.',
  tipo: 'IDEIA',
  tipoLabel: 'Ideia',
  origem: 'CLIENTE',
  origemLabel: 'Cliente',
  prioridade: 'ALTA',
  prioridadeLabel: 'Alta',
  status: 'NOVO',
  statusLabel: 'Novo',
  produtoNome: 'Produto X',
  createdAt: new Date().toISOString(),
  comentariosCount: 3,
  anexosCount: 2,
}

describe('DemandaCard', () => {
  it('exibe as informações principais da demanda', () => {
    render(<DemandaCard demanda={demandaBase} />)

    expect(screen.getByText(/melhoria na jornada/i)).toBeInTheDocument()
    expect(screen.getByText('Ideia')).toBeInTheDocument()
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getByText('Produto X')).toBeInTheDocument()
    expect(screen.getByText('Novo')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('chama callbacks de interação quando fornecidos', () => {
    const onClick = vi.fn()
    const onEdit = vi.fn()
    const onArchive = vi.fn()

    render(
      <DemandaCard demanda={demandaBase} onClick={onClick} onEdit={onEdit} onArchive={onArchive} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /editar demanda/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText(/arquivar/i))
    expect(onArchive).toHaveBeenCalledTimes(1)

    onClick.mockReset()
    fireEvent.click(screen.getByText(/melhoria na jornada/i))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
