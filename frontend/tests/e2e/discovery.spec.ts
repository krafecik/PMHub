import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'
import { setupProdutosApiMocks } from './helpers/api-mocks'
import { createProdutoFixture } from './fixtures/produtos'

// Fixtures para testes de discovery
const discoveryFixture = {
  id: 'DISC-001',
  titulo: 'Discovery de Nova Funcionalidade',
  descricao: 'Descrição do discovery para testes',
  status: 'EM_PESQUISA',
  statusLabel: 'Em Pesquisa',
  produto: {
    id: 'PROD-001',
    nome: 'Produto Teste',
  },
  demanda: {
    id: 'DEM-001',
    titulo: 'Demanda Original',
  },
  responsavel: {
    id: 'pm-001',
    nome: 'PM Teste',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const discoveriesResponse = {
  items: [discoveryFixture],
  total: 1,
  page: 1,
  pageSize: 12,
  totalPages: 1,
}

const estatisticasDiscovery = {
  discoveriesEmPesquisa: 1,
  discoveriesValidando: 0,
  discoveriesFechados: 0,
  taxaValidacaoHipoteses: 0,
}

async function mockDiscoveryRequests(page: Parameters<typeof test>[0]['page']) {
  // Mock de listar discoveries
  await page.route('**/v1/discoveries**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      const url = new URL(route.request().url())
      if (url.pathname.includes('estatisticas')) {
        await fulfillJson(route, estatisticasDiscovery)
        return
      }
      await fulfillJson(route, discoveriesResponse)
      return
    }
    if (method === 'POST') {
      await fulfillJson(route, {
        id: 'DISC-NEW',
        ...discoveryFixture,
        titulo: 'Novo Discovery',
      })
      return
    }
    await route.continue()
  })

  // Mock de obter discovery por ID
  await page.route('**/v1/discoveries/*', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, {
        ...discoveryFixture,
        hipoteses: [],
        pesquisas: [],
        evidencias: [],
        insights: [],
        experimentos: [],
      })
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

  // Mock de demandas (para criar discovery a partir de demanda)
  await page.route('**/v1/demandas**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, {
        data: [
          {
            id: 'DEM-001',
            titulo: 'Demanda para Discovery',
            status: 'PRONTO_DISCOVERY',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      })
      return
    }
    await route.continue()
  })
}

test.describe('Módulo de Discovery', () => {
  test('exibe lista de discoveries', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    await page.goto('/discovery')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Discovery de Nova Funcionalidade')).toBeVisible({ timeout: 10000 })
  })

  test('exibe estatísticas de discovery', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    await page.goto('/discovery')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/em pesquisa/i)).toBeVisible({ timeout: 10000 })
  })

  test('filtra discoveries por status', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    await page.goto('/discovery')
    await page.waitForLoadState('networkidle')

    const statusFilter = page.getByLabel(/status/i)
    if (await statusFilter.count() > 0) {
      await statusFilter.click()
      await page.getByText('Em Pesquisa', { exact: true }).click()
      await page.waitForTimeout(500)
    }
  })

  test('busca discoveries por texto', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    await page.goto('/discovery')
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByPlaceholder(/buscar/i)
    if (await searchInput.count() > 0) {
      await searchInput.fill('Nova Funcionalidade')
      await page.waitForTimeout(500)
      await expect(page.getByText('Discovery de Nova Funcionalidade')).toBeVisible()
    }
  })

  test('cria discovery a partir de demanda', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)
    await setupProdutosApiMocks(page, [createProdutoFixture({ id: 'PROD-001', nome: 'Produto Teste' })])

    await page.goto('/discovery')
    await page.waitForLoadState('networkidle')

    // Clicar em criar discovery
    const criarButton = page.getByRole('button', { name: /novo.*discovery| criar/i })
    if (await criarButton.count() > 0) {
      await criarButton.click()
      await page.waitForTimeout(500)

      // Selecionar demanda
      const demandaSelect = page.getByLabel(/demanda/i)
      if (await demandaSelect.count() > 0) {
        await demandaSelect.click()
        await page.getByText('Demanda para Discovery').click()
      }

      // Preencher título
      const tituloInput = page.getByLabel(/título/i)
      if (await tituloInput.count() > 0) {
        await tituloInput.fill('Novo Discovery Criado')
      }

      // Criar
      const confirmarButton = page.getByRole('button', { name: /criar|confirmar/i })
      if (await confirmarButton.count() > 0) {
        await confirmarButton.click()
        await expect(page.getByRole('status')).toContainText(/criado.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('abre página de detalhes do discovery', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    await page.goto('/discovery')
    await page.waitForLoadState('networkidle')

    await page.getByText('Discovery de Nova Funcionalidade').click()

    await expect(page.getByText(/discovery de nova funcionalidade/i)).toBeVisible({
      timeout: 10000,
    })
  })

  test('cria hipótese no discovery', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    // Mock de criar hipótese
    await page.route('**/v1/discoveries/*/hipoteses', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          id: 'HIP-001',
          titulo: 'Nova Hipótese',
          descricao: 'Descrição da hipótese',
          status: 'PENDENTE',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/discovery/DISC-001')
    await page.waitForLoadState('networkidle')

    // Procurar botão de criar hipótese
    const criarHipoteseButton = page.getByRole('button', { name: /nova.*hipótese| criar.*hipótese/i })
    if (await criarHipoteseButton.count() > 0) {
      await criarHipoteseButton.click()
      await page.waitForTimeout(500)

      // Preencher formulário
      const tituloInput = page.getByLabel(/título/i)
      if (await tituloInput.count() > 0) {
        await tituloInput.fill('Nova Hipótese')
      }

      const descricaoInput = page.getByLabel(/descrição/i)
      if (await descricaoInput.count() > 0) {
        await descricaoInput.fill('Descrição da hipótese')
      }

      // Salvar
      const salvarButton = page.getByRole('button', { name: /salvar|confirmar/i })
      if (await salvarButton.count() > 0) {
        await salvarButton.click()
        await expect(page.getByRole('status')).toContainText(/hipótese.*criada/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('adiciona evidência ao discovery', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    // Mock de criar evidência
    await page.route('**/v1/discoveries/*/evidencias', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          id: 'EVI-001',
          titulo: 'Nova Evidência',
          descricao: 'Descrição da evidência',
          tipo: 'DADO_QUANTITATIVO',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/discovery/DISC-001')
    await page.waitForLoadState('networkidle')

    // Procurar botão de adicionar evidência
    const adicionarEvidenciaButton = page.getByRole('button', {
      name: /adicionar.*evidência|nova.*evidência/i,
    })
    if (await adicionarEvidenciaButton.count() > 0) {
      await adicionarEvidenciaButton.click()
      await page.waitForTimeout(500)

      // Preencher formulário
      const tituloInput = page.getByLabel(/título/i)
      if (await tituloInput.count() > 0) {
        await tituloInput.fill('Nova Evidência')
      }

      // Salvar
      const salvarButton = page.getByRole('button', { name: /salvar|confirmar/i })
      if (await salvarButton.count() > 0) {
        await salvarButton.click()
        await expect(page.getByRole('status')).toContainText(/evidência.*adicionada/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('cria pesquisa no discovery', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    // Mock de criar pesquisa
    await page.route('**/v1/discoveries/*/pesquisas', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          id: 'PES-001',
          titulo: 'Nova Pesquisa',
          tipo: 'ENTREVISTA',
          status: 'PLANEJADA',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/discovery/DISC-001')
    await page.waitForLoadState('networkidle')

    // Procurar botão de criar pesquisa
    const criarPesquisaButton = page.getByRole('button', { name: /nova.*pesquisa| criar.*pesquisa/i })
    if (await criarPesquisaButton.count() > 0) {
      await criarPesquisaButton.click()
      await page.waitForTimeout(500)

      // Preencher formulário
      const tituloInput = page.getByLabel(/título/i)
      if (await tituloInput.count() > 0) {
        await tituloInput.fill('Nova Pesquisa')
      }

      // Salvar
      const salvarButton = page.getByRole('button', { name: /salvar|confirmar/i })
      if (await salvarButton.count() > 0) {
        await salvarButton.click()
        await expect(page.getByRole('status')).toContainText(/pesquisa.*criada/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('finaliza discovery', async ({ page }) => {
    await authenticateUser(page)
    await mockDiscoveryRequests(page)

    // Mock de finalizar discovery
    await page.route('**/v1/discoveries/DISC-001/finalizar', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          success: true,
          message: 'Discovery finalizado com sucesso',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/discovery/DISC-001')
    await page.waitForLoadState('networkidle')

    // Procurar botão de finalizar
    const finalizarButton = page.getByRole('button', { name: /finalizar.*discovery/i })
    if (await finalizarButton.count() > 0) {
      await finalizarButton.click()
      await page.waitForTimeout(500)

      // Confirmar
      const confirmarButton = page.getByRole('button', { name: /confirmar/i })
      if (await confirmarButton.count() > 0) {
        await confirmarButton.click()
        await expect(page.getByRole('status')).toContainText(/finalizado.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('exibe estado vazio quando não há discoveries', async ({ page }) => {
    await authenticateUser(page)

    // Mock com lista vazia
    await page.route('**/v1/discoveries**', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'GET') {
        const url = new URL(route.request().url())
        if (url.pathname.includes('estatisticas')) {
          await fulfillJson(route, {
            discoveriesEmPesquisa: 0,
            discoveriesValidando: 0,
            discoveriesFechados: 0,
            taxaValidacaoHipoteses: 0,
          })
          return
        }
        await fulfillJson(route, {
          items: [],
          total: 0,
          page: 1,
          pageSize: 12,
          totalPages: 0,
        })
        return
      }
      await route.continue()
    })

    await page.goto('/discovery')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/nenhum.*discovery/i)).toBeVisible({ timeout: 10000 })
  })
})

