import { Page, type Route } from '@playwright/test'
import { fulfillJson, fulfillOptions } from '../utils'
import { ProdutoFixture, cloneProdutoList, createProdutoFixture } from '../fixtures/produtos'

type ErrorResponse = {
  status: number
  body: Record<string, unknown>
}

type ProdutosApiMockController = {
  getProdutos(): ProdutoFixture[]
  setProdutos(produtos: ProdutoFixture[]): void
  failNextCreate(error: ErrorResponse): void
  failNextUpdate(error: ErrorResponse): void
  failNextDelete(error: ErrorResponse): void
}

type InternalState = {
  produtos: ProdutoFixture[]
  failCreate?: ErrorResponse
  failUpdate?: ErrorResponse
  failDelete?: ErrorResponse
}

export async function setupProdutosApiMocks(
  page: Page,
  initialProdutos: ProdutoFixture[] = [],
): Promise<ProdutosApiMockController> {
  const state: InternalState = {
    produtos: cloneProdutoList(initialProdutos),
  }

  const handler = async (route: Route) => {
    const request = route.request()
    const method = request.method()

    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    const url = new URL(request.url())
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const hasId = pathSegments.length >= 3
    const produtoId = hasId ? pathSegments[pathSegments.length - 1] : null

    if (method === 'GET' && !hasId) {
      await fulfillJson(route, state.produtos)
      return
    }

    if (method === 'POST' && !hasId) {
      if (state.failCreate) {
        const { status, body } = state.failCreate
        state.failCreate = undefined
        await route.fulfill({
          status,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify(body),
        })
        return
      }

      const payload = safeParseJson<Record<string, unknown>>(request.postData())
      const novoProduto = createProdutoFixture({
        nome: String(payload?.nome ?? 'Produto sem nome'),
        descricao: payload?.descricao ? String(payload.descricao) : null,
        status: (payload?.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
      })

      state.produtos.unshift(novoProduto)

      await fulfillJson(route, novoProduto, 201)
      return
    }

    if (method === 'PATCH' && produtoId) {
      if (state.failUpdate) {
        const { status, body } = state.failUpdate
        state.failUpdate = undefined
        await route.fulfill({
          status,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify(body),
        })
        return
      }

      const payload = safeParseJson<Record<string, unknown>>(request.postData())
      const produtoIndex = state.produtos.findIndex((produto) => produto.id === produtoId)

      if (produtoIndex === -1) {
        await route.fulfill({
          status: 404,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify({ message: 'Produto não encontrado' }),
        })
        return
      }

      const atual = state.produtos[produtoIndex]
      const atualizado: ProdutoFixture = {
        ...atual,
        nome: payload?.nome ? String(payload.nome) : atual.nome,
        descricao:
          payload && Object.prototype.hasOwnProperty.call(payload, 'descricao')
            ? (payload?.descricao as string | null)
            : atual.descricao,
        status: (payload?.status as 'ACTIVE' | 'INACTIVE') ?? atual.status,
        updated_at: new Date().toISOString(),
      }

      state.produtos[produtoIndex] = atualizado

      await fulfillJson(route, atualizado)
      return
    }

    if (method === 'DELETE' && produtoId) {
      if (state.failDelete) {
        const { status, body } = state.failDelete
        state.failDelete = undefined
        await route.fulfill({
          status,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify(body),
        })
        return
      }

      state.produtos = state.produtos.filter((produto) => produto.id !== produtoId)

      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
        },
      })
      return
    }

    await route.continue()
  }

  await page.route('**/v1/produtos', handler)
  await page.route('**/v1/produtos/**', handler)

  return {
    getProdutos: () => cloneProdutoList(state.produtos),
    setProdutos: (produtos) => {
      state.produtos = cloneProdutoList(produtos)
    },
    failNextCreate: (error) => {
      state.failCreate = error
    },
    failNextUpdate: (error) => {
      state.failUpdate = error
    },
    failNextDelete: (error) => {
      state.failDelete = error
    },
  }
}

function safeParseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch (_error) {
    return null
  }
}
