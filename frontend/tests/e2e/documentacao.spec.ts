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

test.describe('Fluxo de Documentação', () => {
  test('lista documentos e apresenta filtros e botão de ajuda', async ({ page }) => {
    await authenticateUser(page)

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

    await page.goto('/documentacao')

    await expect(page.getByRole('heading', { name: 'Documentação de Produto' })).toBeVisible()
    await expect(page.getByText('PRD Onboarding Global')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajuda' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Novo Documento' })).toBeVisible()
  })
})

