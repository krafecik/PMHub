import { test, expect, type Page } from '@playwright/test'
import { fulfillJson, fulfillOptions, mockAuthenticatedSession } from './utils'
import {
  listaPadraoProdutos,
  makeProduto,
  makeProdutosList,
  produtoAtivo,
  produtoInativo,
} from './fixtures/produtos'
import type { Produto } from '@/lib/products-api'

function buildProdutosState(initial: Produto[] = makeProdutosList(4, { includeInactive: true })) {
  let produtos = [...initial]

  return {
    getAll: () => [...produtos],
    setAll: (next: Produto[]) => {
      produtos = [...next]
    },
    add: (produto: Produto) => {
      produtos = [produto, ...produtos]
    },
    update: (id: string, updates: Partial<Produto>) => {
      produtos = produtos.map((produto) =>
        produto.id === id
          ? {
              ...produto,
              ...updates,
              updated_at: updates.updated_at ?? new Date().toISOString(),
            }
          : produto,
      )
    },
    remove: (id: string) => {
      produtos = produtos.filter((produto) => produto.id !== id)
    },
  }
}

async function respondProdutosGet(page: Page, state: ReturnType<typeof buildProdutosState>) {
  await page.route('**/v1/produtos', async (route) => {
    const method = route.request().method()

    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    if (method === 'GET') {
      await fulfillJson(route, state.getAll())
      return
    }

    await route.continue()
  })
}

test.describe('Produtos - Listagem e estados', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page)
  })

  test('exibe lista de produtos com busca e estatísticas', async ({ page }) => {
    const state = buildProdutosState(listaPadraoProdutos)
    await respondProdutosGet(page, state)

    await page.goto('/produtos')

    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
    await expect(page.getByText('Total de Produtos')).toBeVisible()
    await expect(page.getByText(produtoAtivo.nome)).toBeVisible()
    await expect(page.getByText(produtoInativo.nome)).toBeVisible()

    const searchInput = page.getByPlaceholder('Buscar produtos por nome ou descrição...')
    await searchInput.fill('CRM')
    await expect(page.getByText(produtoInativo.nome)).toBeVisible()
    await expect(page.getByText(produtoAtivo.nome)).not.toBeVisible()

    await searchInput.fill('produto inexistente')
    await expect(page.getByText('Nenhum produto encontrado')).toBeVisible()
  })

  test('exibe estado vazio e permite criar primeiro produto', async ({ page }) => {
    const state = buildProdutosState([])

    await page.route('**/v1/produtos', async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'GET') {
        await fulfillJson(route, state.getAll())
        return
      }

      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() ?? '{}')
        const novoProduto = makeProduto({
          id: 'PROD-NEW',
          nome: body.nome,
          descricao: body.descricao ?? null,
          status: body.status ?? 'ACTIVE',
        })

        state.add(novoProduto)
        await fulfillJson(route, novoProduto, 201)
        return
      }

      await route.continue()
    })

    await page.goto('/produtos')
    await expect(page.getByRole('button', { name: 'Criar primeiro produto' })).toBeVisible()
    await page.getByRole('button', { name: 'Criar primeiro produto' }).click()

    await page.getByLabel('Nome do Produto *').fill('Produto Vision')
    await page.getByLabel('Descrição (opcional)').fill('Produto criado a partir do estado vazio')
    await page.getByRole('button', { name: 'Criar Produto' }).click()

    await expect(page.getByText('Produto criado com sucesso!')).toBeVisible()
    await expect(page.getByText('Produto Vision')).toBeVisible()
  })

  test('valida campos obrigatórios no formulário', async ({ page }) => {
    const state = buildProdutosState([])
    await respondProdutosGet(page, state)

    await page.goto('/produtos')
    await page.getByRole('button', { name: 'Novo Produto' }).click()

    await page.getByLabel('Nome do Produto *').fill('AB')
    await page.getByRole('button', { name: 'Criar Produto' }).click()
    await expect(page.getByText('Nome deve ter no mínimo 3 caracteres')).toBeVisible()

    await page.getByLabel('Nome do Produto *').fill('Produto X')
    await page.getByLabel('Descrição (opcional)').fill('A'.repeat(501))
    await page.getByRole('button', { name: 'Criar Produto' }).click()
    await expect(page.getByText('Descrição deve ter no máximo 500 caracteres')).toBeVisible()
  })
})

test.describe('Produtos - Operações CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page)
  })

  test('cria produto com sucesso e atualiza lista', async ({ page }) => {
    const state = buildProdutosState(listaPadraoProdutos)

    await page.route('**/v1/produtos', async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'GET') {
        await fulfillJson(route, state.getAll())
        return
      }

      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() ?? '{}')
        const novoProduto = makeProduto({
          id: 'PROD-100',
          nome: body.nome,
          descricao: body.descricao,
          status: body.status ?? 'ACTIVE',
        })

        state.add(novoProduto)
        await fulfillJson(route, novoProduto, 201)
        return
      }

      await route.continue()
    })

    await page.goto('/produtos')
    await page.getByRole('button', { name: 'Novo Produto' }).click()
    await page.getByLabel('Nome do Produto *').fill('Data Lake Insights')
    await page.getByRole('button', { name: 'Criar Produto' }).click()

    await expect(page.getByText('Produto criado com sucesso!')).toBeVisible()
    await expect(page.getByText('Data Lake Insights')).toBeVisible()
  })

  test('mostra mensagem de erro quando backend falha ao criar', async ({ page }) => {
    const state = buildProdutosState(listaPadraoProdutos)

    await page.route('**/v1/produtos', async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'GET') {
        await fulfillJson(route, state.getAll())
        return
      }

      if (method === 'POST') {
        await route.fulfill({
          status: 400,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify({ message: 'Nome já utilizado por outro produto.' }),
        })
        return
      }

      await route.continue()
    })

    await page.goto('/produtos')
    await page.getByRole('button', { name: 'Novo Produto' }).click()
    await page.getByLabel('Nome do Produto *').fill(produtoAtivo.nome)
    await page.getByRole('button', { name: 'Criar Produto' }).click()

    await expect(page.getByText('Erro ao criar produto')).toBeVisible()
    await expect(page.getByText('Nome já utilizado por outro produto.')).toBeVisible()
  })

  test('edita produto existente e altera status', async ({ page }) => {
    const produtoOriginal = makeProduto({
      id: 'PROD-002',
      nome: 'CRM Legacy',
      status: 'INACTIVE',
    })
    const state = buildProdutosState([produtoAtivo, produtoOriginal])

    await page.route('**/v1/produtos', async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'GET') {
        await fulfillJson(route, state.getAll())
        return
      }

      await route.continue()
    })

    await page.route('**/v1/produtos/PROD-002', async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'PATCH') {
        const body = JSON.parse(route.request().postData() ?? '{}')
        state.update('PROD-002', {
          nome: body.nome,
          descricao: body.descricao ?? produtoOriginal.descricao,
          status: body.status ?? 'ACTIVE',
        })
        await fulfillJson(route, state.getAll()[1])
        return
      }

      await route.continue()
    })

    await page.goto('/produtos')

    const card = page.getByTestId('produto-card-PROD-002')
    await card.hover()
    await card.getByRole('button', { name: 'Ações do produto CRM Legacy' }).click()
    await page.getByRole('menuitem', { name: 'Editar produto' }).click()

    await page.getByLabel('Nome do Produto *').fill('CRM Next')
    await page.getByLabel('Status *').selectOption('ACTIVE')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect(page.getByText('Produto atualizado com sucesso!')).toBeVisible()
    await expect(page.getByText('CRM Next')).toBeVisible()
  })

  test('exibe erro quando usuário não tem permissão para remover', async ({ page }) => {
    const produtoRestrito = makeProduto({ id: 'PROD-FAIL', nome: 'Produto Orion' })
    const state = buildProdutosState([produtoRestrito])

    await respondProdutosGet(page, state)

    await page.route('**/v1/produtos/PROD-FAIL', async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'DELETE') {
        await route.fulfill({
          status: 403,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify({ message: 'Permissão insuficiente para executar esta ação.' }),
        })
        return
      }

      await route.continue()
    })

    await page.goto('/produtos')

    const card = page.getByTestId('produto-card-PROD-FAIL')
    await card.hover()
    await card.getByRole('button', { name: 'Ações do produto Produto Orion' }).click()

    const dialogPromise = page.waitForEvent('dialog').then((dialog) => dialog.accept())
    await page.getByRole('menuitem', { name: 'Remover produto' }).click()
    await dialogPromise

    await expect(page.getByText('Erro ao remover produto')).toBeVisible()
    await expect(card).toBeVisible()
  })

  test('remove produto com sucesso após confirmação', async ({ page }) => {
    const produtoParaRemover = makeProduto({ id: 'PROD-DEL', nome: 'Produto Nebula' })
    const state = buildProdutosState([produtoParaRemover])

    await respondProdutosGet(page, state)

    await page.route('**/v1/produtos/PROD-DEL', async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }

      if (method === 'DELETE') {
        state.remove('PROD-DEL')
        await fulfillJson(route, {}, 204)
        return
      }

      await route.continue()
    })

    await page.goto('/produtos')

    const card = page.getByTestId('produto-card-PROD-DEL')
    await card.hover()
    await card.getByRole('button', { name: 'Ações do produto Produto Nebula' }).click()

    const dialogPromise = page.waitForEvent('dialog').then((dialog) => dialog.accept())
    await page.getByRole('menuitem', { name: 'Remover produto' }).click()
    await dialogPromise

    await expect(page.getByText('Produto removido')).toBeVisible()
    await expect(page.getByTestId('produto-card-PROD-DEL')).toHaveCount(0)
  })
})
