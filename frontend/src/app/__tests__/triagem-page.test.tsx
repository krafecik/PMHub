import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { TriagemChecklist } from '@/components/triagem/TriagemChecklist'
import { SinaisPainel } from '@/components/triagem/sinais-painel'
import { SugestoesPainel } from '@/components/triagem/sugestoes-painel'
import type { DemandaTriagem, TriagemSinal, TriagemSugestao } from '@/lib/triagem-api'
import type { TriagemOption } from '@/hooks/use-triagem-catalogos'
import { renderWithProviders } from '@/__tests__/utils'

const demandaTriagem: DemandaTriagem = {
  id: 'DEM-TRI-001',
  titulo: 'Investigar queda de conversão mobile',
  descricao:
    'Queda significativa de conversão mobile reportada por clientes enterprise. Persona de interesse: PMs e Analistas.',
  tipo: 'PROBLEMA',
  origem: 'CLIENTE',
  produtoId: 'PROD-01',
  anexos: [{ id: 'AX1', nome: 'heatmap.png', url: 'https://example.com/heatmap.png' }],
  triagem: {
    id: 'TRI-01',
    status: 'PENDENTE_TRIAGEM',
    impacto: 'ALTO',
    urgencia: 'ALTA',
    complexidade: 'MEDIA',
    duplicatasRevisadas: false,
  },
  duplicatasSugeridas: [
    { id: 'DEM-REF-02', titulo: 'Bug checkout mobile', similaridade: 0.82 },
    { id: 'DEM-REF-03', titulo: 'Instabilidade analytics', similaridade: 0.58 },
  ],
}

const metadataOptions: Record<string, TriagemOption> = {
  impacto: {
    value: 'ALTO',
    label: 'Alto Impacto',
    slug: 'alto',
    metadata: {
      requireStakeholder: false,
      checklistHint: 'Confirme métricas críticas e anexos relevantes.',
    },
  },
  urgencia: {
    value: 'ALTA',
    label: 'Alta urgência',
    slug: 'alta',
    metadata: {
      requireMetrics: false,
    },
  },
  complexidade: {
    value: 'MEDIA',
    label: 'Complexidade média',
    slug: 'media',
    metadata: {
      descriptionMinWords: 5,
      descriptionMinChars: 40,
    },
  },
}

const sinais: TriagemSinal[] = [
  {
    tipo: 'dados_insuficientes',
    titulo: 'Descrição precisa de evidências',
    descricao: 'Inclua capturas de tela e métricas de analytics para reforçar a hipótese.',
    severidade: 'warning',
  },
  {
    tipo: 'duplicata_potencial',
    titulo: 'Possível duplicata existente',
    descricao: 'Existe demanda similar registrada no último trimestre.',
    severidade: 'danger',
  },
]

const sugestoes: TriagemSugestao[] = [
  {
    tipo: 'acao',
    titulo: 'Solicitar evidências adicionais',
    descricao: 'Peça logs da jornada de compra mobile para entender o impacto real.',
    prioridade: 'media',
  },
  {
    tipo: 'discovery',
    titulo: 'Encaminhar para discovery rápido',
    descricao: 'Validar hipóteses com entrevistas rápidas focadas em onboarding mobile.',
    prioridade: 'alta',
    relacionados: [
      { id: 'DISC-01', titulo: 'Discovery mobile 2023', referencia: 'Alta similaridade' },
    ],
  },
]

const TriagemPage = () => {
  const [todosObrigatoriosFeitos, setTodosObrigatoriosFeitos] = React.useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <TriagemChecklist
        demanda={demandaTriagem}
        metadataContext={{
          impactoOption: metadataOptions.impacto,
          urgenciaOption: metadataOptions.urgencia,
          complexidadeOption: metadataOptions.complexidade,
        }}
        onChange={setTodosObrigatoriosFeitos}
      />

      <div className="space-y-4">
        <div data-testid="status-triagem">
          {todosObrigatoriosFeitos
            ? 'Checklist completo para envio.'
            : 'Checklist ainda possui pendências.'}
        </div>
        <SinaisPainel sinais={sinais} />
        <SugestoesPainel sugestoes={sugestoes} />
      </div>
    </div>
  )
}

describe('Triagem page integration', () => {
  beforeEach(() => {
    renderWithProviders(<TriagemPage />)
  })

  it('apresenta checklist, sinais e sugestões com dados relevantes', () => {
    expect(screen.getByText('🔎 Checklist de Triagem')).toBeInTheDocument()
    expect(screen.getByText('Descrição clara e objetiva')).toBeInTheDocument()
    expect(screen.getByText('Descrição precisa de evidências')).toBeInTheDocument()
    expect(screen.getByText('Solicitar evidências adicionais')).toBeInTheDocument()
    expect(screen.getByTestId('status-triagem')).toHaveTextContent('pendências')
  })

  it('permite completar itens obrigatórios até liberar envio para discovery', () => {
    const requiredLabels = [
      'Descrição clara e objetiva',
      'Alinhada ao produto correto',
      'Impacto avaliado',
      'Urgência avaliada',
      'Duplicações revisadas',
    ]

    for (const label of requiredLabels) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`Marcar ${label}`, 'i') }))
    }

    expect(screen.getByTestId('status-triagem')).toHaveTextContent('Checklist completo')
    expect(screen.getByText('Pronto para Discovery')).toBeInTheDocument()
  })
})
