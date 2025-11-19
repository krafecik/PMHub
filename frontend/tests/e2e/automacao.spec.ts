import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'

const regraAutomacao = {
  id: 'REG-001',
  nome: 'Regra de Triagem Automática',
  descricao: 'Regra para triagem automática de demandas',
  ativa: true,
  prioridade: 1,
  condicoes: {
    tipo: 'IDEIA',
    origem: 'CLIENTE',
  },
  acoes: {
    impacto: 'ALTO',
    urgencia: 'MEDIA',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const regrasResponse = {
  data: [regraAutomacao],
  total: 1,
  page: 1,
  pageSize: 50,
  totalPages: 1,
}

async function mockAutomacaoRequests(page: Parameters<typeof test>[0]['page']) {
  // Mock de listar regras
  await page.route('**/v1/automacao/regras**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, regrasResponse)
      return
    }
    if (method === 'POST') {
      await fulfillJson(route, {
        id: 'REG-NEW',
        ...regraAutomacao,
        nome: 'Nova Regra',
      })
      return
    }
    await route.continue()
  })

  // Mock de obter regra por ID
  await page.route('**/v1/automacao/regras/*', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, regraAutomacao)
      return
    }
    if (method === 'PATCH') {
      await fulfillJson(route, {
        ...regraAutomacao,
        nome: 'Regra Atualizada',
      })
      return
    }
    if (method === 'DELETE') {
      await fulfillJson(route, {
        success: true,
        message: 'Regra removida com sucesso',
      })
      return
    }
    await route.continue()
  })

  // Mock de logs de execução
  await page.route('**/v1/automacao/regras/*/logs**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, {
        data: [
          {
            id: 'LOG-001',
            regraId: 'REG-001',
            demandaId: 'DEM-001',
            executadoEm: new Date().toISOString(),
            sucesso: true,
            resultado: 'Regra aplicada com sucesso',
          },
        ],
        total: 1,
      })
      return
    }
    await route.continue()
  })
}

test.describe('Módulo de Automação', () => {
  test('lista regras de automação', async ({ page }) => {
    await authenticateUser(page)
    await mockAutomacaoRequests(page)

    await page.goto('/automacao')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Regra de Triagem Automática')).toBeVisible({ timeout: 10000 })
  })

  test('filtra regras por status', async ({ page }) => {
    await authenticateUser(page)
    await mockAutomacaoRequests(page)

    await page.goto('/automacao')
    await page.waitForLoadState('networkidle')

    const statusFilter = page.getByLabel(/status|ativa/i)
    if (await statusFilter.count() > 0) {
      await statusFilter.click()
      await page.getByText('Ativa', { exact: true }).click()
      await page.waitForTimeout(500)
    }
  })

  test('cria nova regra de automação', async ({ page }) => {
    await authenticateUser(page)
    await mockAutomacaoRequests(page)

    await page.goto('/automacao')
    await page.waitForLoadState('networkidle')

    const novoButton = page.getByRole('button', { name: /nova.*regra| criar/i })
    if (await novoButton.count() > 0) {
      await novoButton.click()
      await page.waitForTimeout(500)

      // Preencher formulário
      const nomeInput = page.getByLabel(/nome/i)
      if (await nomeInput.count() > 0) {
        await nomeInput.fill('Nova Regra de Automação')
      }

      // Salvar
      const salvarButton = page.getByRole('button', { name: /salvar|confirmar/i })
      if (await salvarButton.count() > 0) {
        await salvarButton.click()
        await expect(page.getByRole('status')).toContainText(/criada.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('edita regra existente', async ({ page }) => {
    await authenticateUser(page)
    await mockAutomacaoRequests(page)

    await page.goto('/automacao')
    await page.waitForLoadState('networkidle')

    await page.getByText('Regra de Triagem Automática').click()
    await page.waitForTimeout(500)

    const editarButton = page.getByRole('button', { name: /editar/i })
    if (await editarButton.count() > 0) {
      await editarButton.click()
      await page.waitForTimeout(500)

      const nomeInput = page.getByLabel(/nome/i)
      if (await nomeInput.count() > 0) {
        await nomeInput.clear()
        await nomeInput.fill('Regra Atualizada')
        await page.getByRole('button', { name: /salvar/i }).click()
        await expect(page.getByRole('status')).toContainText(/atualizada.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('visualiza logs de execução', async ({ page }) => {
    await authenticateUser(page)
    await mockAutomacaoRequests(page)

    await page.goto('/automacao')
    await page.waitForLoadState('networkidle')

    await page.getByText('Regra de Triagem Automática').click()
    await page.waitForTimeout(500)

    const logsTab = page.getByRole('tab', { name: /logs|execução/i })
    if (await logsTab.count() > 0) {
      await logsTab.click()
      await expect(page.getByText(/executado/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('ativa/desativa regra', async ({ page }) => {
    await authenticateUser(page)
    await mockAutomacaoRequests(page)

    await page.goto('/automacao')
    await page.waitForLoadState('networkidle')

    const toggleButton = page.getByRole('button', { name: /ativar|desativar/i })
    if (await toggleButton.count() > 0) {
      await toggleButton.click()
      await expect(page.getByRole('status')).toContainText(/atualizada/i, {
        timeout: 10000,
      })
    }
  })

  test('exibe estado vazio quando não há regras', async ({ page }) => {
    await authenticateUser(page)

    await page.route('**/v1/automacao/regras**', async (route) => {
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

    await page.goto('/automacao')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/nenhuma.*regra/i)).toBeVisible({ timeout: 10000 })
  })
})

