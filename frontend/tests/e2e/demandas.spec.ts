import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'

const demandasResponse = {
  data: [
    {
      id: 'DEM-100',
      titulo: 'Fluxo de onboarding multi-tenant',
      descricao: 'Permitir configurar regras distintas por unidade de negócio.',
      tipo: 'IDEIA',
      tipoLabel: 'Ideia',
      produtoId: 'PROD-01',
      produtoNome: 'Produto Atlas',
      origem: 'CLIENTE',
      origemLabel: 'Cliente',
      prioridade: 'ALTA',
      prioridadeLabel: 'Alta',
      prioridadeColor: '#f97316',
      status: 'NOVO',
      statusLabel: 'Novo',
      responsavelId: 'pm-01',
      criadoPorId: 'usr-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comentariosCount: 4,
      anexosCount: 2,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 50,
  totalPages: 1,
}

test.describe('Fluxo de Demandas', () => {
  test('exibe lista de demandas com filtros e botão de ajuda', async ({ page }) => {
    await authenticateUser(page)

    await page.route('**/v1/demandas**', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'GET') {
        await fulfillJson(route, demandasResponse)
        return
      }
      await route.continue()
    })

    await page.goto('/demandas')

    await expect(page.getByRole('heading', { name: 'Demandas' })).toBeVisible()
    await expect(
      page.getByText('Todas as ideias, problemas e oportunidades em um só lugar'),
    ).toBeVisible()
    await expect(page.getByText('Fluxo de onboarding multi-tenant')).toBeVisible()
    await expect(page.getByText('#DEM-100')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajuda' })).toBeVisible()
  })
})

