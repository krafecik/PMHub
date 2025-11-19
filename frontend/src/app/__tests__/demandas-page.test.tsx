import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { DemandasTableView } from '@/components/demandas/demandas-table-view'
import { DemandaCard } from '@/components/demandas/demanda-card'
import type { DemandaListItem } from '@/lib/demandas-api'
import type { DemandaCardProps } from '@/components/demandas/demanda-card'
import { renderWithProviders } from '@/__tests__/utils'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => {
      const sanitizedProps = { ...rest }
      delete sanitizedProps.initial
      delete sanitizedProps.animate
      delete sanitizedProps.transition
      delete sanitizedProps.whileHover
      return (
        <div data-testid="motion-div" {...sanitizedProps}>
          {children}
        </div>
      )
    },
  },
}))

vi.mock('@radix-ui/react-dropdown-menu', () => {
  const Component = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  const Item = ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <div role="menuitem" onClick={onSelect}>
      {children}
    </div>
  )

  return {
    Root: Component,
    Trigger: Component,
    Content: Component,
    Portal: Component,
    Separator: Component,
    Item,
  }
})

const demandas: DemandaListItem[] = [
  {
    id: 'DEM-001',
    titulo: 'Melhoria no onboarding',
    tipo: 'IDEIA',
    tipoLabel: 'Ideia',
    produtoId: 'PROD-01',
    produtoNome: 'Produto Atlas',
    origem: 'CLIENTE',
    origemLabel: 'Cliente',
    prioridade: 'ALTA',
    prioridadeLabel: 'Alta',
    prioridadeColor: '#f97316',
    status: 'NOVO',
    statusLabel: 'Novo',
    criadoPorId: 'USR-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comentariosCount: 2,
    anexosCount: 1,
  },
  {
    id: 'DEM-002',
    titulo: 'Correção de bug crítico',
    tipo: 'PROBLEMA',
    tipoLabel: 'Bug',
    produtoId: 'PROD-01',
    produtoNome: 'Produto Atlas',
    origem: 'SUPORTE',
    origemLabel: 'Suporte',
    prioridade: 'CRITICA',
    prioridadeLabel: 'Crítica',
    prioridadeColor: '#dc2626',
    status: 'TRIAGEM',
    statusLabel: 'Triagem',
    criadoPorId: 'USR-02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comentariosCount: 5,
    anexosCount: 3,
  },
]

const demandaDetalhes: Record<string, DemandaCardProps['demanda']> = {
  'DEM-001': {
    id: 'DEM-001',
    titulo: 'Melhoria no onboarding',
    descricao: 'Permitir personalização avançada do fluxo inicial.',
    tipo: 'IDEIA',
    tipoLabel: 'Ideia',
    origem: 'CLIENTE',
    origemLabel: 'Cliente',
    prioridade: 'ALTA',
    prioridadeLabel: 'Alta',
    status: 'NOVO',
    statusLabel: 'Novo',
    produtoNome: 'Produto Atlas',
    createdAt: new Date().toISOString(),
    comentariosCount: 2,
    anexosCount: 1,
  },
  'DEM-002': {
    id: 'DEM-002',
    titulo: 'Correção de bug crítico',
    descricao: 'Erro no checkout impede conclusão de compra.',
    tipo: 'PROBLEMA',
    tipoLabel: 'Bug',
    origem: 'SUPORTE',
    origemLabel: 'Suporte',
    prioridade: 'CRITICA',
    prioridadeLabel: 'Crítica',
    status: 'TRIAGEM',
    statusLabel: 'Em triagem',
    produtoNome: 'Produto Atlas',
    createdAt: new Date().toISOString(),
    comentariosCount: 5,
    anexosCount: 3,
  },
}

const DemandasPage = () => {
  const [selectedId, setSelectedId] = React.useState<string>(demandas[0].id)
  const [selectedCount, setSelectedCount] = React.useState(0)

  const selectedDemanda = demandaDetalhes[selectedId]

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <DemandasTableView
        demandas={demandas}
        onSelect={(id) => setSelectedId(id)}
        onSelectionChange={(ids) => setSelectedCount(ids.length)}
        onEdit={vi.fn()}
      />

      <div className="space-y-4">
        <p data-testid="selecionadas">
          {selectedCount === 0
            ? 'Nenhuma demanda selecionada manualmente.'
            : `${selectedCount} item selecionado`}
        </p>
        {selectedDemanda && (
          <div data-testid="detalhe-demanda">
            <DemandaCard demanda={selectedDemanda} />
          </div>
        )}
      </div>
    </div>
  )
}

describe('Demandas page integration', () => {
  it('permite navegar entre demandas e reflete seleção no card detalhado', () => {
    renderWithProviders(<DemandasPage />)

    const detalheInicial = screen.getByTestId('detalhe-demanda')
    expect(detalheInicial).toHaveTextContent('Melhoria no onboarding')
    expect(detalheInicial).toHaveTextContent('Permitir personalização avançada do fluxo inicial.')

    fireEvent.click(screen.getByText('#DEM-002'))

    const detalheAtualizado = screen.getByTestId('detalhe-demanda')
    expect(detalheAtualizado).toHaveTextContent('Correção de bug crítico')
    expect(detalheAtualizado).toHaveTextContent('Erro no checkout impede conclusão de compra.')
  })

  it('exibe contador de seleção quando linhas são marcadas', () => {
    renderWithProviders(<DemandasPage />)

    expect(screen.getByTestId('selecionadas')).toHaveTextContent(
      'Nenhuma demanda selecionada manualmente.',
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar demanda DEM-001' }))

    expect(screen.getByTestId('selecionadas')).toHaveTextContent('1 item selecionado')
  })
})
