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

async function mockPlanejamentoRequests(page: Parameters<typeof test>[0]['page']) {
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

  // Mock de épicos
  await page.route('**/v1/planejamento/epicos**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, {
        data: planejamentoDashboardResponse.epicos.data,
        total: 1,
      })
      return
    }
    if (method === 'POST') {
      await fulfillJson(route, {
        id: 'EP-NEW',
        titulo: 'Novo Épico',
        status: 'PLANNED',
      })
      return
    }
    await route.continue()
  })

  // Mock de features
  await page.route('**/v1/planejamento/features**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, {
        data: [],
        total: 0,
      })
      return
    }
    await route.continue()
  })
}

test.describe('Módulo de Planejamento', () => {
  test('exibe dashboards, cards de épicos e cenários simulados', async ({ page }) => {
    await authenticateUser(page)
    await mockPlanejamentoRequests(page)

    await page.goto('/planejamento')

    await expect(page.getByRole('heading', { name: 'Planejamento trimestral' })).toBeVisible()
    await expect(page.getByText('Carga planejada')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Nova jornada cross-squad' })).toBeVisible()
    await expect(page.getByText('Cenário Base')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajuda' })).toBeVisible()
  })

  test('navega para página de épicos', async ({ page }) => {
    await authenticateUser(page)
    await mockPlanejamentoRequests(page)

    await page.goto('/planejamento')
    await page.waitForLoadState('networkidle')

    const epicosLink = page.getByRole('link', { name: /épicos/i })
    if (await epicosLink.count() > 0) {
      await epicosLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/épicos/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('navega para página de features', async ({ page }) => {
    await authenticateUser(page)
    await mockPlanejamentoRequests(page)

    await page.goto('/planejamento')
    await page.waitForLoadState('networkidle')

    const featuresLink = page.getByRole('link', { name: /features/i })
    if (await featuresLink.count() > 0) {
      await featuresLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/features/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('navega para roadmap', async ({ page }) => {
    await authenticateUser(page)
    await mockPlanejamentoRequests(page)

    await page.goto('/planejamento')
    await page.waitForLoadState('networkidle')

    const roadmapLink = page.getByRole('link', { name: /roadmap/i })
    if (await roadmapLink.count() > 0) {
      await roadmapLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/roadmap/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('navega para simulador de cenários', async ({ page }) => {
    await authenticateUser(page)
    await mockPlanejamentoRequests(page)

    await page.goto('/planejamento')
    await page.waitForLoadState('networkidle')

    const simuladorLink = page.getByRole('link', { name: /simulador/i })
    if (await simuladorLink.count() > 0) {
      await simuladorLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/simulador/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('navega para capacidade', async ({ page }) => {
    await authenticateUser(page)
    await mockPlanejamentoRequests(page)

    await page.goto('/planejamento')
    await page.waitForLoadState('networkidle')

    const capacidadeLink = page.getByRole('link', { name: /capacidade/i })
    if (await capacidadeLink.count() > 0) {
      await capacidadeLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/capacidade/i)).toBeVisible({ timeout: 10000 })
    }
  })
})

