import { test, expect } from '@playwright/test'
import { setupProdutosApiMocks } from './helpers/api-mocks'
import { navigateToProdutos } from './helpers/navigation'
import { createProdutoFixture } from './fixtures/produtos'


test.describe('Gestão de Produtos', () => {
  test('exibe lista de produtos, estatísticas e permite buscar', async ({ page }) => {
    const produtos = [
      createProdutoFixture({ id: 'PROD-100', nome: 'Produto Atlas', descricao: 'Suite principal' }),
      createProdutoFixture({ id: 'PROD-101', nome: 'Data Fabric', descricao: 'Integração de dados' }),
      createProdutoFixture({ id: 'PROD-102', nome: 'CEM Fatura', descricao: 'Backoffice financeiro' }),
    ]

    await setupProdutosApiMocks(page, produtos)
    await navigateToProdutos(page)

    await expect(page.getByText('Total de Produtos')).toBeVisible()
    await expect(page.locator('[data-testid^="produto-card-"]')).toHaveCount(produtos.length)

    await expect(page.getByText('Produto Atlas')).toBeVisible()
    await expect(page.getByText('Data Fabric')).toBeVisible()
    await expect(page.getByText('CEM Fatura')).toBeVisible()

    const searchInput = page.getByPlaceholder('Buscar produtos por nome ou descrição...')
    await searchInput.fill('Data')
    await expect(page.locator('[data-testid="produto-card-PROD-101"]')).toBeVisible()
    await expect(page.locator('[data-testid="produto-card-PROD-100"]')).toHaveCount(0)

    await searchInput.fill('não existe')
    await expect(page.getByText('Nenhum produto encontrado')).toBeVisible()
    await expect(page.getByText('Tente ajustar os termos de busca')).toBeVisible()
    await expect(page.locator('[data-testid^="produto-card-"]')).toHaveCount(0)
  })

  test('cria novo produto com sucesso', async ({ page }) => {
    await setupProdutosApiMocks(page, [])
    await navigateToProdutos(page)

    await page.getByRole('button', { name: /Novo Produto/i }).first().click()
    await expect(page.getByRole('heading', { name: /Novo Produto/i })).toBeVisible()

    await page.getByLabel('Nome do Produto *').fill('Produto IA Insight')
    await page.getByLabel('Status *').selectOption('ACTIVE')
    await page.getByLabel('Descrição (opcional)').fill('Produto focado em automações inteligentes')

    await page.getByRole('button', { name: /Criar Produto/i }).click()

    await expect(page.getByRole('heading', { name: /Novo Produto/i })).toHaveCount(0)
    await expect(page.getByText('Produto IA Insight')).toBeVisible()
    await expect(page.getByText('Produto focado em automações inteligentes')).toBeVisible()
  })

  test('impede criação com dados inválidos e mostra validações', async ({ page }) => {
    await setupProdutosApiMocks(page, [])
    await navigateToProdutos(page)

    await page.getByRole('button', { name: /Novo Produto/i }).first().click()

    await page.getByRole('button', { name: /Criar Produto/i }).click()

    await expect(page.getByText('Nome deve ter no mínimo 3 caracteres')).toBeVisible()

    await page.getByLabel('Nome do Produto *').fill('AB')
    await page.getByRole('button', { name: /Criar Produto/i }).click()
    await expect(page.getByText('Nome deve ter no mínimo 3 caracteres')).toBeVisible()
  })

  test('exibe erro de validação do backend ao criar produto', async ({ page }) => {
    const api = await setupProdutosApiMocks(page, [])
    await navigateToProdutos(page)

    api.failNextCreate({
      status: 400,
      body: { message: 'Nome de produto já utilizado neste tenant.' },
    })

    await page.getByRole('button', { name: /Novo Produto/i }).first().click()
    await page.getByLabel('Nome do Produto *').fill('Produto Duplicado')

    await page.getByRole('button', { name: /Criar Produto/i }).click()

    await expect(page.getByRole('heading', { name: /Novo Produto/i })).toBeVisible()
    await expect(page.getByLabel('Nome do Produto *')).toHaveValue('Produto Duplicado')
    await expect(page.locator('[data-testid^="produto-card-"]')).toHaveCount(0)
  })

  test('edita produto existente e atualiza status', async ({ page }) => {
    const produto = createProdutoFixture({ id: 'PROD-300', nome: 'Produto Evoluir', descricao: 'Primeira versão' })
    await setupProdutosApiMocks(page, [produto])
    await navigateToProdutos(page)

    const card = page.getByTestId('produto-card-PROD-300')
    await card.hover()
    await page.getByRole('button', { name: 'Ações do produto Produto Evoluir' }).click()
    await page.getByRole('menuitem', { name: 'Editar produto' }).click()

    await expect(page.getByRole('heading', { name: /Editar Produto/i })).toBeVisible()

    const nomeInput = page.getByLabel('Nome do Produto *')
    await nomeInput.fill('Produto Evoluir 2.0')
    await page.getByLabel('Status *').selectOption('INACTIVE')
    await page.getByLabel('Descrição (opcional)').fill('Nova descrição para o produto atualizado')

    await page.getByRole('button', { name: /Salvar alterações/i }).click()

    await expect(page.getByText('Produto Evoluir 2.0')).toBeVisible()
    await expect(card.getByText('Inativo')).toBeVisible()
    await expect(page.getByText('Nova descrição para o produto atualizado')).toBeVisible()
  })

  test('remove produto após confirmação do usuário', async ({ page }) => {
    const produtos = [
      createProdutoFixture({ id: 'PROD-400', nome: 'Produto Removível' }),
      createProdutoFixture({ id: 'PROD-401', nome: 'Produto Persistente' }),
    ]

    await setupProdutosApiMocks(page, produtos)

    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm')
      await dialog.accept()
    })

    await navigateToProdutos(page)

    const card = page.getByTestId('produto-card-PROD-400')
    await card.hover()
    await page.getByRole('button', { name: 'Ações do produto Produto Removível' }).click()
    await page.getByRole('menuitem', { name: 'Remover produto' }).click()

    await page.reload()

    await expect(page.locator('[data-testid="produto-card-PROD-400"]')).toHaveCount(0)
    await expect(page.getByText('Produto Persistente')).toBeVisible()
  })

  test('exibe estados vazios apropriados', async ({ page }) => {
    await setupProdutosApiMocks(page, [])
    await navigateToProdutos(page)

    await expect(page.getByText('Nenhum produto cadastrado')).toBeVisible()
    await expect(page.getByRole('button', { name: /Criar primeiro produto/i })).toBeVisible()
  })
})
