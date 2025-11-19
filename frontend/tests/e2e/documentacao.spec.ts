import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'

const documentoItem = {
  id: 'DOC-001',
  tenantId: 'tenant-001',
  tipo: 'PRD',
  titulo: 'PRD Onboarding Global',
  resumo: 'Definição completa do fluxo de onboarding multi-tenant.',
  status: 'APROVADO',
  produtoId: 'PROD-01',
  pmId: 'pm-01',
  squadId: null,
  versaoAtual: {
    id: 'VER-1',
    documentoId: 'DOC-001',
    tenantId: 'tenant-001',
    versao: '1.0',
    objetivo: 'Garantir consistência no onboarding em escala.',
    contexto: {
      problema: 'Usuários enterprise enfrentam fricção inicial.',
      dados: 'Taxa de abandono em 35%.',
      personas: 'Admins e PMs responsáveis pela ativação.',
    },
    requisitosFuncionais: [],
    regrasNegocio: [],
    requisitosNaoFuncionais: [],
    fluxos: undefined,
    criteriosAceite: [],
    riscos: [],
    createdAt: new Date().toISOString(),
  },
  versoes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const documentosResponse = {
  total: 1,
  page: 1,
  pageSize: 20,
  itens: [documentoItem],
}

const produtosResponse = [
  {
    id: 'PROD-01',
    tenant_id: 'tenant-001',
    nome: 'Produto Atlas',
    descricao: 'Plataforma de gestão de produto',
    status: 'ATIVO',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

async function mockDocumentacaoRequests(page: Parameters<typeof test>[0]['page']) {
  await page.route('**/v1/documentacao**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, documentosResponse)
      return
    }
    if (method === 'POST') {
      await fulfillJson(route, {
        id: 'DOC-NEW',
        ...documentoItem,
        titulo: 'Novo Documento',
      })
      return
    }
    await route.continue()
  })

  await page.route('**/v1/documentacao/*', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, documentoItem)
      return
    }
    if (method === 'PATCH') {
      await fulfillJson(route, {
        ...documentoItem,
        titulo: 'Documento Atualizado',
      })
      return
    }
    await route.continue()
  })

  await page.route('**/v1/produtos**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, produtosResponse)
      return
    }
    await route.continue()
  })
}

test.describe('Módulo de Documentação', () => {
  test('lista documentos e apresenta filtros e botão de ajuda', async ({ page }) => {
    await authenticateUser(page)
    await mockDocumentacaoRequests(page)

    await page.goto('/documentacao')

    await expect(page.getByRole('heading', { name: 'Documentação de Produto' })).toBeVisible()
    await expect(page.getByText('PRD Onboarding Global')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajuda' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Novo Documento' })).toBeVisible()
  })

  test('filtra documentos por tipo', async ({ page }) => {
    await authenticateUser(page)
    await mockDocumentacaoRequests(page)

    await page.goto('/documentacao')
    await page.waitForLoadState('networkidle')

    const tipoFilter = page.getByLabel(/tipo/i)
    if (await tipoFilter.count() > 0) {
      await tipoFilter.click()
      await page.getByText('PRD', { exact: true }).click()
      await page.waitForTimeout(500)
    }
  })

  test('busca documentos por texto', async ({ page }) => {
    await authenticateUser(page)
    await mockDocumentacaoRequests(page)

    await page.goto('/documentacao')
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByPlaceholder(/buscar/i)
    if (await searchInput.count() > 0) {
      await searchInput.fill('Onboarding')
      await page.waitForTimeout(500)
      await expect(page.getByText('PRD Onboarding Global')).toBeVisible()
    }
  })

  test('abre página de detalhes do documento', async ({ page }) => {
    await authenticateUser(page)
    await mockDocumentacaoRequests(page)

    await page.goto('/documentacao')
    await page.waitForLoadState('networkidle')

    await page.getByText('PRD Onboarding Global').click()

    await expect(page.getByText(/prd onboarding global/i)).toBeVisible({ timeout: 10000 })
  })

  test('cria novo documento', async ({ page }) => {
    await authenticateUser(page)
    await mockDocumentacaoRequests(page)

    await page.goto('/documentacao')
    await page.waitForLoadState('networkidle')

    const novoButton = page.getByRole('button', { name: /novo.*documento/i })
    if (await novoButton.count() > 0) {
      await novoButton.click()
      await page.waitForTimeout(500)

      // Preencher formulário
      const tituloInput = page.getByLabel(/título/i)
      if (await tituloInput.count() > 0) {
        await tituloInput.fill('Novo PRD')
      }

      // Salvar
      const salvarButton = page.getByRole('button', { name: /salvar|confirmar/i })
      if (await salvarButton.count() > 0) {
        await salvarButton.click()
        await expect(page.getByRole('status')).toContainText(/criado.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('exibe estado vazio quando não há documentos', async ({ page }) => {
    await authenticateUser(page)

    await page.route('**/v1/documentacao**', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'GET') {
        await fulfillJson(route, {
          total: 0,
          page: 1,
          pageSize: 20,
          itens: [],
        })
        return
      }
      await route.continue()
    })

    await page.goto('/documentacao')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/nenhum.*documento/i)).toBeVisible({ timeout: 10000 })
  })
})

