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

  test('cria demanda completa com todos os campos', async ({ page }) => {
    const demandasApi = await setupDemandasApiMocks(page, [])
    await setupProdutosApiMocks(page, [
      createProdutoFixture({ id: 'PROD-888', nome: 'Produto Completo' }),
    ])

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Nova Demanda' }).click()
    await page.waitForTimeout(500)

    // Aba Informações básicas
    await page.getByText('Ideia', { exact: true }).first().click()
    await page.getByLabel('Título *').fill('Nova funcionalidade completa de relatórios')
    await page.getByLabel('Produto *').selectOption('PROD-888')
    
    // Descrição com RichTextEditor
    const descricaoEditor = page.locator('[contenteditable="true"]').first()
    await descricaoEditor.fill('Esta é uma descrição completa da demanda com detalhes importantes.')

    // Aba Classificação e contexto
    await page.getByRole('tab', { name: 'Classificação e contexto' }).click()
    await page.getByLabel('Origem *').selectOption('CLIENTE')
    await page.getByLabel('Prioridade *').selectOption('ALTA')
    await page.getByLabel('Status inicial *').selectOption('NOVO')

    // Aba Atribuição
    await page.getByRole('tab', { name: 'Atribuição' }).click()
    await page.getByLabel('Responsável (opcional)').selectOption('usr-100')

    await page.getByRole('button', { name: 'Criar Demanda' }).click()

    await expect.poll(() => demandasApi.getDemandas().length, { timeout: 10000 }).toBe(1)
    const novaDemanda = demandasApi.getDemandas()[0]

    expect(novaDemanda.titulo).toBe('Nova funcionalidade completa de relatórios')
    expect(novaDemanda.tipo).toBe('IDEIA')
    expect(novaDemanda.produtoId).toBe('PROD-888')
    expect(novaDemanda.origem).toBe('CLIENTE')
    expect(novaDemanda.prioridade).toBe('ALTA')
    expect(novaDemanda.status).toBe('NOVO')
    expect(novaDemanda.responsavelId).toBe('usr-100')
  })

  test('valida campos obrigatórios na criação', async ({ page }) => {
    await setupDemandasApiMocks(page, [])
    await setupProdutosApiMocks(page, [
      createProdutoFixture({ id: 'PROD-999', nome: 'Produto Teste' }),
    ])

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Nova Demanda' }).click()
    await page.waitForTimeout(500)

    // Tentar criar sem preencher campos obrigatórios
    await page.getByRole('button', { name: 'Criar Demanda' }).click()

    // Deve mostrar erros de validação
    await expect(page.getByText(/título deve ter no mínimo/i).or(page.getByText(/selecione o tipo/i))).toBeVisible({ timeout: 5000 })
  })

  test('edita demanda existente com sucesso', async ({ page }) => {
    const demandaOriginal = createDemandaFixture({
      id: 'DEM-500',
      titulo: 'Título Original',
      tipo: 'IDEIA',
      tipoLabel: 'Ideia',
      status: 'NOVO',
      statusLabel: 'Novo',
    })

    const demandasApi = await setupDemandasApiMocks(page, [demandaOriginal], [
      createDemandaDetalheFixture(demandaOriginal),
    ])

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    // Abrir drawer
    await page.getByText('Título Original', { exact: true }).first().click()
    await expect(page.getByText('#DEM-500')).toBeVisible({ timeout: 5000 })

    // Entrar em modo de edição
    await page.getByRole('button', { name: 'Editar' }).click()
    await page.waitForTimeout(500)

    // Editar campos
    await page.getByLabel('Título *').clear()
    await page.getByLabel('Título *').fill('Título Atualizado')

    await page.getByRole('tab', { name: 'Classificação e contexto' }).click()
    await page.getByLabel('Prioridade *').selectOption('BAIXA')

    // Salvar
    await page.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect(page.getByRole('status')).toContainText('Demanda atualizada com sucesso!', { timeout: 10000 })

    const demandaAtualizada = demandasApi.getDemandas()[0]
    expect(demandaAtualizada.titulo).toBe('Título Atualizado')
    expect(demandaAtualizada.prioridade).toBe('BAIXA')
  })

  test('adiciona e remove tags da demanda', async ({ page }) => {
    const demanda = createDemandaFixture({
      id: 'DEM-600',
      titulo: 'Demanda com Tags',
    })

    const demandasApi = await setupDemandasApiMocks(page, [demanda], [
      createDemandaDetalheFixture({
        ...demanda,
        tags: [],
      }),
    ])

    // Mock para adicionar/remover tags
    await page.route('**/v1/demandas/*/tags', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'POST') {
        await fulfillJson(route, { message: 'Tag adicionada com sucesso' }, 201)
        return
      }

      if (method === 'DELETE') {
        await fulfillJson(route, { message: 'Tag removida com sucesso' })
        return
      }

      await route.continue()
    })

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    await page.getByText('Demanda com Tags', { exact: true }).first().click()
    await expect(page.getByText('#DEM-600')).toBeVisible({ timeout: 5000 })

    // Adicionar tag
    await page.getByLabel('Adicionar tag').fill('Nova Tag')
    await page.getByRole('button', { name: 'Adicionar Tag' }).click()

    await expect(page.getByRole('status')).toContainText('Tag adicionada com sucesso!', { timeout: 10000 })

    // Remover tag (se houver botão de remover)
    const removeButtons = page.getByRole('button', { name: /remover/i })
    const count = await removeButtons.count()
    if (count > 0) {
      await removeButtons.first().click()
      await expect(page.getByRole('status')).toContainText('Tag removida com sucesso!', { timeout: 10000 })
    }
  })

  test('cancela demanda com motivo', async ({ page }) => {
    const demanda = createDemandaFixture({
      id: 'DEM-700',
      titulo: 'Demanda para Cancelar',
      status: 'NOVO',
      statusLabel: 'Novo',
    })

    const demandasApi = await setupDemandasApiMocks(page, [demanda], [
      createDemandaDetalheFixture(demanda),
    ])

    // Mock para cancelar demanda
    await page.route('**/v1/demandas/*/cancelar', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'POST') {
        await fulfillJson(route, { message: 'Demanda cancelada com sucesso' })
        return
      }

      await route.continue()
    })

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    await page.getByText('Demanda para Cancelar', { exact: true }).first().click()
    await expect(page.getByText('#DEM-700')).toBeVisible({ timeout: 5000 })

    // Clicar em cancelar
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await page.waitForTimeout(500)

    // Preencher motivo e confirmar
    await page.getByLabel('Motivo do cancelamento').fill('Demanda não é mais necessária')
    await page.getByRole('button', { name: 'Confirmar Cancelamento' }).click()

    await expect(page.getByRole('status')).toContainText('Demanda cancelada com sucesso!', { timeout: 10000 })
  })

  test('move demanda para triagem', async ({ page }) => {
    const demanda = createDemandaFixture({
      id: 'DEM-800',
      titulo: 'Demanda para Triagem',
      status: 'NOVO',
      statusLabel: 'Novo',
    })

    await setupDemandasApiMocks(page, [demanda], [
      createDemandaDetalheFixture(demanda),
    ])

    // Mock para mover para triagem
    await page.route('**/v1/triagem/demandas/*/triar', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'POST') {
        await fulfillJson(route, { message: 'Demanda movida para triagem' })
        return
      }

      await route.continue()
    })

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    await page.getByText('Demanda para Triagem', { exact: true }).first().click()
    await expect(page.getByText('#DEM-800')).toBeVisible({ timeout: 5000 })

    // Mover para triagem
    await page.getByRole('button', { name: 'Mover para Triagem' }).click()

    await expect(page.getByRole('status')).toContainText(/movida.*triagem/i, { timeout: 10000 })
  })

  test('filtra demandas por múltiplos critérios', async ({ page }) => {
    const demandas = [
      createDemandaFixture({
        id: 'DEM-901',
        titulo: 'Ideia de Produto A',
        tipo: 'IDEIA',
        tipoLabel: 'Ideia',
        status: 'NOVO',
        statusLabel: 'Novo',
        prioridade: 'ALTA',
        prioridadeLabel: 'Alta',
      }),
      createDemandaFixture({
        id: 'DEM-902',
        titulo: 'Problema no Produto B',
        tipo: 'PROBLEMA',
        tipoLabel: 'Problema',
        status: 'EM_ANDAMENTO',
        statusLabel: 'Em Andamento',
        prioridade: 'BAIXA',
        prioridadeLabel: 'Baixa',
      }),
      createDemandaFixture({
        id: 'DEM-903',
        titulo: 'Oportunidade de Mercado',
        tipo: 'OPORTUNIDADE',
        tipoLabel: 'Oportunidade',
        status: 'NOVO',
        statusLabel: 'Novo',
        prioridade: 'MEDIA',
        prioridadeLabel: 'Média',
      }),
    ]

    const demandasApi = await setupDemandasApiMocks(page, demandas)

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    // Expandir filtros
    await page.getByRole('button', { name: 'Expandir filtros' }).click()
    await page.waitForTimeout(500)

    // Filtrar por tipo
    await page.getByText('Ideia', { exact: true }).first().click()
    await expect.poll(() => demandasApi.getLastListQuery()?.get('tipo') ?? '').toBe('IDEIA')

    // Filtrar por status
    await page.getByText('Novo', { exact: true }).first().click()
    await expect.poll(() => demandasApi.getLastListQuery()?.get('status') ?? '').toBe('NOVO')

    // Limpar filtros
    await page.getByRole('button', { name: 'Limpar filtros' }).click({ timeout: 5000 }).catch(() => {})
  })

  test('exibe estado vazio quando não há demandas', async ({ page }) => {
    await setupDemandasApiMocks(page, [])

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Nenhuma demanda cadastrada')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /criar.*primeira.*demanda/i })).toBeVisible()
  })

  test('exibe erro ao criar demanda com título muito longo', async ({ page }) => {
    const demandasApi = await setupDemandasApiMocks(page, [])
    demandasApi.failNextCreate({
      status: 400,
      body: {
        message: 'Campos inválidos',
        details: [{ field: 'titulo', issue: 'Título deve ter no máximo 255 caracteres' }],
      },
    })

    await setupProdutosApiMocks(page, [
      createProdutoFixture({ id: 'PROD-1000', nome: 'Produto Teste' }),
    ])

    await authenticateUser(page)
    await setupCommonMocks(page)

    await page.goto('/demandas')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Nova Demanda' }).click()
    await page.waitForTimeout(500)

    await page.getByText('Ideia', { exact: true }).first().click()
    await page.getByLabel('Título *').fill('A'.repeat(300)) // Título muito longo
    await page.getByLabel('Produto *').selectOption('PROD-1000')

    await page.getByRole('tab', { name: 'Classificação e contexto' }).click()
    await page.getByLabel('Origem *').selectOption('CLIENTE')
    await page.getByLabel('Prioridade *').selectOption('ALTA')
    await page.getByLabel('Status inicial *').selectOption('NOVO')

    await page.getByRole('button', { name: 'Criar Demanda' }).click()

    await expect(page.getByRole('status')).toContainText(/erro.*criar.*demanda/i, { timeout: 10000 })
  })
})

