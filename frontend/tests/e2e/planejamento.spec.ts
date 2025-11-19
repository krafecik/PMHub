import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'

const planejamentoDashboardResponse = {
  quarter: 'Q1 2026',
  planningCycle: null,
  capacity: {
    total: 120,
    allocated: 90,
    utilization: 75,
    squads: [
      {
        id: 'cap-1',
        tenantId: 'tenant-001',
        squadId: 'Squad Alpha',
        quarter: 'Q1 2026',
        capacidadeTotal: 60,
        capacidadeUsada: 45,
        bufferPercentual: 10,
      },
    ],
  },
  epicos: {
    total: 1,
    data: [
      {
        id: 'EP-001',
        titulo: 'Nova jornada cross-squad',
        descricao: 'Integra squads para acelerar discovery.',
        status: 'IN_PROGRESS',
        health: 'YELLOW',
        quarter: 'Q1 2026',
        squadId: 'Squad Alpha',
        ownerId: 'pm-01',
        sponsorId: 'cpo-01',
        progressPercent: 55,
      },
    ],
  },
  commitment: {
    id: 'COM-1',
    tenantId: 'tenant-001',
    quarter: 'Q1 2026',
    documentoUrl: null,
    assinaturas: [],
    tiers: [
      {
        key: 'committed',
        id: 'tier-1',
        slug: 'committed',
        label: 'Committed',
        metadata: { legacyValue: 'COMMITTED' },
        itens: [
          { epicoId: 'EP-001', titulo: 'Nova jornada cross-squad', squadId: 'Squad Alpha' },
        ],
      },
    ],
    itens: {
      committed: [],
      targeted: [],
      aspirational: [],
    },
    committed: [],
    targeted: [],
    aspirational: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  insights: ['Priorize squads com menor buffer.', 'Revisar capacidade da Squad Beta.'],
}

const planejamentoTimelineResponse = {
  'Squad Alpha': {
    squadId: 'Squad Alpha',
    epicos: [
      {
        id: 'EP-001',
        titulo: 'Nova jornada cross-squad',
        status: 'IN_PROGRESS',
        quarter: 'Q1 2026',
        progressPercent: 55,
      },
    ],
  },
}

const planejamentoCenariosResponse = [
  {
    id: 'SCN-1',
    nome: 'Cenário Base',
    descricao: 'Priorização padrão do quarter.',
    status: 'ACTIVE',
    statusSlug: 'published',
    statusLabel: 'Publicado',
    statusId: 'published',
    statusMetadata: { badgeVariant: 'success' },
    quarter: 'Q1 2026',
    incluirContractors: true,
    considerarFerias: false,
    bufferRiscoPercentual: 12,
    resultado: {
      cabemEpicos: ['EP-001'],
      atrasadosEpicos: [],
    },
  },
]

test.describe('Fluxo de Planejamento', () => {
  test('exibe dashboards, cards de épicos e cenários simulados', async ({ page }) => {
    await authenticateUser(page)

    const planningHandlers = [
      { pattern: '**/v1/planejamento/dashboard**', body: planejamentoDashboardResponse },
      { pattern: '**/v1/planejamento/timeline**', body: planejamentoTimelineResponse },
      { pattern: '**/v1/planejamento/cenarios**', body: planejamentoCenariosResponse },
    ]

    for (const handler of planningHandlers) {
      await page.route(handler.pattern, async (route) => {
        const method = route.request().method()
        if (method === 'OPTIONS') {
          await fulfillOptions(route)
          return
        }
        if (method === 'GET') {
          await fulfillJson(route, handler.body)
          return
        }
        await route.continue()
      })
    }

    await page.goto('/planejamento')

    await expect(page.getByRole('heading', { name: 'Planejamento trimestral' })).toBeVisible()
    await expect(page.getByText('Carga planejada')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Nova jornada cross-squad' })).toBeVisible()
    await expect(page.getByText('Cenário Base')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajuda' })).toBeVisible()
  })
})

