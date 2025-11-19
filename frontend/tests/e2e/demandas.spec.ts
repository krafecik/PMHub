import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'
import { setupDemandasApiMocks } from './helpers/demandas-api-mocks'
import { setupProdutosApiMocks } from './helpers/api-mocks'
import { createDemandaFixture, createDemandaDetalheFixture } from './fixtures/demandas'
import { createProdutoFixture } from './fixtures/produtos'

async function mockCatalogRequests(page: Parameters<typeof test>[0]['page']) {
  await page.route('**/v1/catalogos/categorias**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    const emptyResponse = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    }

    await fulfillJson(route, emptyResponse)
  })
}

async function mockUsuariosRequest(page: Parameters<typeof test>[0]['page']) {
  await page.route('**/v1/users**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    await fulfillJson(route, [
      {
        id: 'usr-100',
        email: 'pm@example.com',
        nome: 'PM Example',
        status: 'ACTIVE',
        provider: 'LOCAL',
        tenants: [{ tenantId: 'tenant-001', role: 'PM' }],
      },
      {
        id: 'usr-200',
        email: 'cpo@example.com',
        nome: 'CPO Example',
        status: 'ACTIVE',
        provider: 'LOCAL',
        tenants: [{ tenantId: 'tenant-001', role: 'CPO' }],
      },
    ])
  })
}

async function mockDiscoveryRequests(page: Parameters<typeof test>[0]['page']) {
  await page.route('**/v1/discoveries**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    await route.fulfill({
      status: 404,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ message: 'Discovery não encontrado' }),
    })
  })
}

const catalogRoutes = [mockCatalogRequests, mockUsuariosRequest, mockDiscoveryRequests]

async function setupCommonMocks(page: Parameters<typeof test>[0]['page']) {
  for (const register of catalogRoutes) {
    await register(page)
  }
}

test.describe('Central de Demandas', () => {
  test('exibe lista com busca e filtros interativos', async ({ page }) => {
    const demandaIdeia = createDemandaFixture({
      id: 'DEM-101',
      titulo: 'Integração com CRM',
      tipo: 'IDEIA',
      tipoLabel: 'Ideia',
      status: 'NOVO',
      statusLabel: 'Novo',
    })
    const demandaProblema = createDemandaFixture({
      id: 'DEM-202',
      titulo: 'Erro no fluxo de pagamento',
      tipo: 'PROBLEMA',
      tipoLabel: 'Problema',
      status: 'ARQUIVADO',
      statusLabel: 'Arquivado',
    })

    const demandasApi = await setupDemandasApiMocks(page, [demandaIdeia, demandaProblema])

    await authenticateUser(page)
    await setupCommonMocks(page)

    page.on('console', (msg) => console.log('[browser]', msg.type(), msg.text()))
    page.on('requestfailed', (request) => {
      console.log('[request failed]', request.method(), request.url())
    })

    await page.goto('/demandas')

    const bodyText = await page.locator('body').innerText()
    console.log('[demanda list body]', bodyText)
    console.log('[demanda list rows]', await page.locator('table tbody tr').count())

    await expect(page.locator('text=Integração com CRM').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Erro no fluxo de pagamento').first()).not.toBeVisible()

    // Busca textual
    await page.getByPlaceholder('Buscar por título ou tipo...').fill('pagamento')
    await expect(page.locator('text=Integração com CRM').first()).not.toBeVisible()
    await expect(page.getByText('#DEM-202')).toBeVisible()
    await page.getByPlaceholder('Buscar por título ou tipo...').fill('Integração')
    await expect(page.locator('text=Integração com CRM').first()).toBeVisible()

    // Expandir filtros e selecionar tipo
    await page.getByRole('button', { name: 'Expandir filtros' }).click({ timeout: 5000 })
    await page.getByText('Problema', { exact: true }).first().click()

    await expect.poll(() => demandasApi.getLastListQuery()?.get('tipo') ?? '').toBe('PROBLEMA')

    // Mostrar arquivadas para exibir demanda arquivada
    await page.getByLabel('Mostrar arquivadas').click()
    await expect(page.getByText('Erro no fluxo de pagamento')).toBeVisible()
  })

  test('cria demanda rápida com sucesso e abre detalhes', async ({ page }) => {
    const demandasApi = await setupDemandasApiMocks(page, [])
    await setupProdutosApiMocks(page, [
      createProdutoFixture({ id: 'PROD-777', nome: 'Plataforma Aurora' }),
    ])

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')

    await page.getByRole('button', { name: 'Nova Demanda' }).click()
    await page.getByText('Ideia', { exact: true }).first().click()
    await page.getByLabel('Título *').fill('Nova automação de onboarding')
    await page.getByLabel('Produto *').selectOption('PROD-777')

    await page.getByRole('tab', { name: 'Classificação e contexto' }).click()
    await page.getByLabel('Origem *').selectOption('CLIENTE')
    await page.getByLabel('Prioridade *').selectOption('ALTA')
    await page.getByLabel('Status inicial *').selectOption('NOVO')

    await page.getByRole('tab', { name: 'Atribuição' }).click()
    await page.getByLabel('Responsável (opcional)').selectOption('usr-100')

    await page.getByRole('button', { name: 'Criar Demanda' }).click()

    await expect.poll(() => demandasApi.getDemandas().length, { timeout: 10000 }).toBe(1)
    const novaDemanda = demandasApi.getDemandas()[0]

    const tableRows = page.locator('table tbody tr')
    await expect(tableRows).toHaveCount(1, { timeout: 10000 })

    // Drawer deve abrir automaticamente com os detalhes
    await expect(page.getByText(`#${novaDemanda.id}`)).toBeVisible()
    await expect(page.getByText('Nova automação de onboarding')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByText(`#${novaDemanda.id}`)).toHaveCount(0)
  })

  test('abre o drawer de detalhes e exibe informações principais', async ({ page }) => {
    const demanda = createDemandaFixture({
      id: 'DEM-320',
      titulo: 'Rever estratégia de churn',
      descricao: 'Detalhes completos da demanda criada a partir de dados de churn.',
      tipo: 'OPORTUNIDADE',
      tipoLabel: 'Oportunidade',
      status: 'NOVO',
      statusLabel: 'Novo',
    })

    await setupDemandasApiMocks(page, [demanda], [
      createDemandaDetalheFixture({
        ...demanda,
        origemDetalhe: 'Feedback de clientes estratégicos',
        tags: [
          { id: 'TAG-1', nome: 'Retenção' },
          { id: 'TAG-2', nome: 'Analytics' },
        ],
      }),
    ])

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.getByRole('button', { name: 'Visualização em cards' }).click()

    await expect(page.getByText('Rever estratégia de churn', { exact: true })).toBeVisible({ timeout: 15000 })
    await page.getByText('Rever estratégia de churn', { exact: true }).first().click()

    await expect(page.getByText('#DEM-320')).toBeVisible()
    await expect(page.getByText('Rever estratégia de churn')).toBeVisible()
    await expect(page.getByText('Oportunidade')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByText('#DEM-320')).toHaveCount(0)
  })
})

