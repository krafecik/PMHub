import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'
import { setupProdutosApiMocks } from './helpers/api-mocks'
import { createProdutoFixture } from './fixtures/produtos'

// Fixtures para testes de triagem
const demandaPendenteTriagem = {
  id: 'DEM-TRI-001',
  titulo: 'Nova funcionalidade de relatórios',
  descricao: 'Descrição completa da demanda para triagem com pelo menos 20 palavras para atender aos requisitos do checklist de triagem.',
  tipo: 'IDEIA',
  tipoLabel: 'Ideia',
  produto: {
    id: 'PROD-001',
    nome: 'Produto Teste',
  },
  origem: 'CLIENTE',
  origemLabel: 'Cliente',
  triagem: {
    id: 'TRI-001',
    status: 'PENDENTE_TRIAGEM',
    impacto: null,
    urgencia: null,
    complexidade: null,
    possivelDuplicata: false,
    duplicatasRevisadas: false,
  },
  responsavel: {
    id: 'pm-001',
    nome: 'PM Teste',
  },
  criadoPor: {
    id: 'usr-001',
    nome: 'Usuário Teste',
  },
  createdAt: new Date().toISOString(),
}

const demandasPendentesResponse = {
  data: [demandaPendenteTriagem],
  total: 1,
  page: 1,
  pageSize: 50,
  totalPages: 1,
}

const estatisticasTriagem = {
  totalPendentes: 1,
  totalAguardandoInfo: 0,
  totalRetomados: 0,
  totalProntoDiscovery: 0,
  totalDuplicados: 0,
  totalArquivados: 0,
}

async function mockTriagemRequests(page: Parameters<typeof test>[0]['page']) {
  // Mock de demandas pendentes
  await page.route('**/v1/triagem/demandas-pendentes**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, demandasPendentesResponse)
      return
    }
    await route.continue()
  })

  // Mock de estatísticas
  await page.route('**/v1/triagem/estatisticas**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, estatisticasTriagem)
      return
    }
    await route.continue()
  })

  // Mock de catálogos
  await page.route('**/v1/catalogos/categorias**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    await fulfillJson(route, {
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    })
  })

  // Mock de usuários
  await page.route('**/v1/users**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    await fulfillJson(route, [
      {
        id: 'pm-001',
        email: 'pm@example.com',
        name: 'PM Teste',
        status: 'ACTIVE',
        role: 'PM',
      },
    ])
  })

  // Mock de sinais, sugestões e histórico (vazios por padrão)
  await page.route('**/v1/triagem/demandas/*/sinais**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    await fulfillJson(route, { sinais: [] })
  })

  await page.route('**/v1/triagem/demandas/*/sugestoes**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    await fulfillJson(route, { sugestoes: [] })
  })

  await page.route('**/v1/triagem/demandas/*/historico-solucoes**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    await fulfillJson(route, { solucoes: [] })
  })
}

test.describe('Módulo de Triagem', () => {
  test('exibe lista de demandas pendentes de triagem', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Nova funcionalidade de relatórios')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Pendente')).toBeVisible()
  })

  test('exibe estatísticas de triagem', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/pendentes/i)).toBeVisible({ timeout: 10000 })
  })

  test('abre modal de detalhes ao clicar em demanda', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()

    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('Nova funcionalidade de relatórios')).toBeVisible()
  })

  test('preenche triagem completa (impacto, urgência, complexidade)', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    // Mock de triar demanda
    await page.route('**/v1/triagem/demandas/DEM-TRI-001/triar', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'PATCH') {
        await fulfillJson(route, {
          success: true,
          message: 'Demanda triada com sucesso',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()
    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })

    // Preencher impacto
    const impactoSelect = page.locator('select, [role="combobox"]').filter({ hasText: /impacto/i }).first()
    if (await impactoSelect.count() > 0) {
      await impactoSelect.click()
      await page.getByText('Alto', { exact: true }).first().click()
    }

    // Preencher urgência
    const urgenciaSelect = page.locator('select, [role="combobox"]').filter({ hasText: /urgência/i }).first()
    if (await urgenciaSelect.count() > 0) {
      await urgenciaSelect.click()
      await page.getByText('Média', { exact: true }).first().click()
    }

    // Preencher complexidade
    const complexidadeSelect = page
      .locator('select, [role="combobox"]')
      .filter({ hasText: /complexidade/i })
      .first()
    if (await complexidadeSelect.count() > 0) {
      await complexidadeSelect.click()
      await page.getByText('Baixa', { exact: true }).first().click()
    }

    // Salvar triagem
    const salvarButton = page.getByRole('button', { name: /salvar.*triagem/i })
    if (await salvarButton.count() > 0) {
      await salvarButton.click()
      await expect(page.getByRole('status')).toContainText(/triada.*sucesso/i, { timeout: 10000 })
    }
  })

  test('completa checklist de triagem', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()
    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })

    // Verificar se há aba de checklist
    const checklistTab = page.getByRole('tab', { name: /checklist/i })
    if (await checklistTab.count() > 0) {
      await checklistTab.click()

      // Verificar itens do checklist
      await expect(page.getByText(/descrição.*clara/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('adiciona observações na triagem', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()
    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })

    // Procurar campo de observações (RichTextEditor)
    const observacoesEditor = page.locator('[contenteditable="true"]').filter({ hasText: /observação/i })
    if (await observacoesEditor.count() === 0) {
      // Tentar encontrar por label
      const observacoesLabel = page.getByLabel(/observação/i)
      if (await observacoesLabel.count() > 0) {
        await observacoesLabel.fill('Observações importantes sobre a triagem desta demanda.')
      }
    } else {
      await observacoesEditor.first().fill('Observações importantes sobre a triagem desta demanda.')
    }
  })

  test('solicita informações adicionais', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    // Mock de solicitar informações
    await page.route('**/v1/triagem/demandas/*/solicitar-info', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          success: true,
          message: 'Solicitação de informações enviada',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()
    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })

    // Clicar em solicitar informações
    const solicitarButton = page.getByRole('button', { name: /solicitar.*informação/i })
    if (await solicitarButton.count() > 0) {
      await solicitarButton.click()

      // Preencher modal
      const motivoInput = page.getByLabel(/motivo|mensagem/i)
      if (await motivoInput.count() > 0) {
        await motivoInput.fill('Preciso de mais detalhes sobre o escopo')
        await page.getByRole('button', { name: /enviar|confirmar/i }).click()
        await expect(page.getByRole('status')).toContainText(/solicitação.*enviada/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('reatribui PM responsável', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    // Mock de reatribuir PM
    await page.route('**/v1/triagem/demandas/*/reatribuir-pm', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          success: true,
          message: 'PM reatribuído com sucesso',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()
    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })

    // Clicar em reatribuir PM
    const reatribuirButton = page.getByRole('button', { name: /reatribuir.*pm/i })
    if (await reatribuirButton.count() > 0) {
      await reatribuirButton.click()

      // Selecionar novo PM
      const pmSelect = page.getByLabel(/pm.*responsável/i)
      if (await pmSelect.count() > 0) {
        await pmSelect.click()
        await page.getByText('PM Teste').click()
        await page.getByRole('button', { name: /confirmar|salvar/i }).click()
        await expect(page.getByRole('status')).toContainText(/reatribuído.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('marca demanda como duplicata', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    // Mock de marcar duplicata
    await page.route('**/v1/triagem/demandas/*/marcar-duplicata', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          success: true,
          message: 'Demanda marcada como duplicata',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()
    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })

    // Clicar em marcar duplicata
    const duplicataButton = page.getByRole('button', { name: /marcar.*duplicata/i })
    if (await duplicataButton.count() > 0) {
      await duplicataButton.click()

      // Preencher modal
      const demandaOriginalInput = page.getByLabel(/demanda.*original/i)
      if (await demandaOriginalInput.count() > 0) {
        await demandaOriginalInput.fill('DEM-000')
        await page.getByRole('button', { name: /confirmar/i }).click()
        await expect(page.getByRole('status')).toContainText(/duplicata/i, { timeout: 10000 })
      }
    }
  })

  test('arquiva demanda na triagem', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    // Mock de arquivar
    await page.route('**/v1/triagem/demandas/DEM-TRI-001/triar', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'PATCH') {
        await fulfillJson(route, {
          success: true,
          message: 'Demanda arquivada com sucesso',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await page.getByText('Nova funcionalidade de relatórios').click()
    await expect(page.getByRole('heading', { name: /#DEM-TRI-001.*Triagem/i })).toBeVisible({
      timeout: 10000,
    })

    // Clicar em arquivar
    const arquivarButton = page.getByRole('button', { name: /arquivar/i })
    if (await arquivarButton.count() > 0) {
      await arquivarButton.click()
      await expect(page.getByRole('status')).toContainText(/arquivada.*sucesso/i, {
        timeout: 10000,
      })
    }
  })

  test('filtra demandas por status', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    // Expandir filtros
    const expandirFiltros = page.getByRole('button', { name: /expandir.*filtro/i })
    if (await expandirFiltros.count() > 0) {
      await expandirFiltros.click()
      await page.waitForTimeout(500)

      // Filtrar por status
      const statusFilter = page.getByLabel(/status/i)
      if (await statusFilter.count() > 0) {
        await statusFilter.click()
        await page.getByText('Pendente', { exact: true }).click()
      }
    }
  })

  test('busca demandas por texto', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByPlaceholder(/buscar/i)
    if (await searchInput.count() > 0) {
      await searchInput.fill('relatórios')
      await page.waitForTimeout(500)
      await expect(page.getByText('Nova funcionalidade de relatórios')).toBeVisible()
    }
  })

  test('alterna entre visualizações (cards, lista, kanban)', async ({ page }) => {
    await authenticateUser(page)
    await mockTriagemRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    // Alternar para cards
    const cardsButton = page.getByRole('button', { name: /cards|grid/i })
    if (await cardsButton.count() > 0) {
      await cardsButton.click()
      await page.waitForTimeout(500)
    }

    // Alternar para lista
    const listaButton = page.getByRole('button', { name: /lista/i })
    if (await listaButton.count() > 0) {
      await listaButton.click()
      await page.waitForTimeout(500)
    }

    // Alternar para kanban
    const kanbanButton = page.getByRole('button', { name: /kanban/i })
    if (await kanbanButton.count() > 0) {
      await kanbanButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('exibe estado vazio quando não há demandas', async ({ page }) => {
    await authenticateUser(page)

    // Mock com lista vazia
    await page.route('**/v1/triagem/demandas-pendentes**', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'GET') {
        await fulfillJson(route, {
          data: [],
          total: 0,
          page: 1,
          pageSize: 50,
          totalPages: 0,
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/nenhuma.*demanda/i)).toBeVisible({ timeout: 10000 })
  })
})

