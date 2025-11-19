import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders, createMockRouter } from '@/__tests__/utils'
import { DiscoveryCard } from '@/components/discovery/discovery-card'
import { DiscoveryOverview } from '@/components/discovery/detail/overview'
import type { DiscoveryListItem, DiscoveryCompleto } from '@/lib/discovery-api'

const listItems: DiscoveryListItem[] = [
  {
    id: 'DISC-001',
    demandaId: 'DEM-001',
    titulo: 'Reduzir abandono na etapa de pagamento',
    descricao: 'Explorar motivos do abandono e validar soluções alternativas.',
    status: 'EM_PESQUISA',
    statusLabel: 'Em Pesquisa',
    produtoId: 'PROD-01',
    produtoNome: 'Produto Atlas',
    responsavelId: 'PM-01',
    responsavelNome: 'Ana Ribeiro',
    qtdHipoteses: 4,
    qtdPesquisas: 2,
    qtdInsights: 6,
    qtdExperimentos: 1,
    tags: ['checkout', 'conversion'],
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-05T10:00:00.000Z',
  },
]

const discoveryDetalhe: DiscoveryCompleto = {
  id: 'DISC-001',
  demandaId: 'DEM-001',
  titulo: 'Reduzir abandono na etapa de pagamento',
  descricao: 'Descobrir principais obstáculos que impedem finalização da compra.',
  contexto: 'Clientes enterprise relataram dificuldades nos métodos de pagamento.',
  publicoAfetado: ['Clientes Enterprise', 'Clientes SMB'],
  volumeImpactado: '35% da base ativa',
  severidade: 'Alta',
  severidadeLabel: 'Alta',
  comoIdentificado: ['analytics', 'feedback_cliente'],
  status: 'EM_PESQUISA',
  statusLabel: 'Em Pesquisa',
  produtoId: 'PROD-01',
  produtoNome: 'Produto Atlas',
  responsavelId: 'PM-01',
  responsavelNome: 'Ana Ribeiro',
  criadoPorId: 'USR-01',
  criadoPorNome: 'Bruno Lima',
  hipoteses: [
    {
      id: 'HIP-1',
      titulo: 'Falta de Pix no checkout mobile',
      descricao: 'Adicionar Pix reduziria atrito para maioria dos clientes mobile.',
      comoValidar: 'Teste A/B com oferta de Pix para 50% dos usuários.',
      metricaAlvo: 'Conversão mobile +8%',
      impactoEsperado: 'Conversão cresce 8 pontos percentuais.',
      prioridade: 'ALTA',
      status: 'EM_TESTE',
      statusLabel: 'Em teste',
      qtdEvidencias: 2,
      qtdExperimentos: 1,
      createdAt: '2024-03-02T12:00:00.000Z',
    },
  ],
  pesquisas: [],
  evidencias: [],
  insights: [],
  experimentos: [],
  decisao: undefined,
  evolucaoLog: [],
  createdAt: '2024-03-01T10:00:00.000Z',
  updatedAt: '2024-03-05T10:00:00.000Z',
}

const DiscoveryPage = () => (
  <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
    <div className="space-y-4" data-testid="lista-discovery">
      {listItems.map((item) => (
        <DiscoveryCard key={item.id} discovery={item} />
      ))}
    </div>
    <div data-testid="overview-discovery">
      <DiscoveryOverview discovery={discoveryDetalhe} />
    </div>
  </div>
)

describe('Discovery page integration', () => {
  it('renderiza cards e overview e navega ao visualizar detalhes', () => {
    const push = vi.fn()
    const router = createMockRouter({ push })

    renderWithProviders(<DiscoveryPage />, { router })

    const list = screen.getByTestId('lista-discovery')
    expect(list).toHaveTextContent('Discovery #DISC-001')
    expect(list).toHaveTextContent('Reduzir abandono na etapa de pagamento')

    const overview = screen.getByTestId('overview-discovery')
    expect(overview).toHaveTextContent('Hipóteses')
    expect(overview).toHaveTextContent('Produto:')

    fireEvent.click(screen.getByRole('button', { name: /Visualizar/i }))

    expect(push).toHaveBeenCalledWith('/discovery/DISC-001')
  })
})
