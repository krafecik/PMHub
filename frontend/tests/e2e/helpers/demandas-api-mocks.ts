import { Page, type Route } from '@playwright/test'
import { fulfillJson, fulfillOptions } from '../utils'
import {
  createDemandaDetalheFixture,
  createDemandaFixture,
  DemandaDetalheFixture,
  DemandaFixture,
} from '../fixtures/demandas'

type ErrorResponse = {
  status: number
  body: Record<string, unknown>
}

type DemandasApiMockController = {
  getDemandas(): DemandaFixture[]
  setDemandas(demandas: DemandaFixture[]): void
  setDetalhe(detalhe: DemandaDetalheFixture): void
  failNextCreate(error: ErrorResponse): void
  failNextUpdate(error: ErrorResponse): void
  getLastListQuery(): URLSearchParams | null
}

type InternalState = {
  demandas: DemandaFixture[]
  detalhes: Record<string, DemandaDetalheFixture>
  failCreate?: ErrorResponse
  failUpdate?: ErrorResponse
  lastListQuery: URLSearchParams | null
}

export async function setupDemandasApiMocks(
  page: Page,
  initialDemandas: DemandaFixture[] = [],
  initialDetalhes: DemandaDetalheFixture[] = [],
): Promise<DemandasApiMockController> {
  const state: InternalState = {
    demandas: initialDemandas.map((demanda) => ({ ...demanda })),
    detalhes: initialDetalhes.reduce<Record<string, DemandaDetalheFixture>>((acc, detalhe) => {
      acc[detalhe.id] = { ...detalhe }
      return acc
    }, {}),
    lastListQuery: null,
  }

  const listHandler = async (route: Route) => {
    const request = route.request()
    const method = request.method()

    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    const url = new URL(request.url())

    if (method === 'GET') {
      state.lastListQuery = url.searchParams
      const responseBody = {
        data: state.demandas,
        total: state.demandas.length,
        page: Number(url.searchParams.get('page') ?? '1'),
        pageSize: Number(url.searchParams.get('pageSize') ?? '50'),
        totalPages: 1,
      }

      console.log('[mock demandas] GET', url.pathname + url.search)

      await fulfillJson(route, responseBody)
      return
    }

    if (method === 'POST') {
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

      const payload = safeParseJson<Record<string, any>>(request.postData()) ?? {}
      const novo = createDemandaFixture({
        titulo: payload.titulo ?? 'Demanda sem título',
        tipo: payload.tipo ?? 'IDEIA',
        tipoLabel: payload.tipo ?? 'Ideia',
        produtoId: payload.produtoId ?? 'PROD-001',
        produtoNome: payload.produtoNome ?? 'Produto Padrão',
        origem: payload.origem ?? 'CLIENTE',
        origemLabel: payload.origem ?? 'Cliente',
        prioridade: payload.prioridade ?? 'MEDIA',
        prioridadeLabel: payload.prioridade ?? 'Média',
        status: payload.status ?? 'NOVO',
        statusLabel: payload.status ?? 'Novo',
      })

      state.demandas.unshift(novo)
      state.detalhes[novo.id] = createDemandaDetalheFixture({
        ...novo,
        descricao: payload.descricao ?? novo.descricao,
        origemDetalhe: payload.origemDetalhe,
      })

      console.log('[mock demandas] POST', novo.id)

      await fulfillJson(route, { id: novo.id, message: 'Demanda criada com sucesso' }, 201)
      return
    }

    await route.continue()
  }

  const detalheHandler = async (route: Route) => {
    const request = route.request()
    const method = request.method()

    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    const url = new URL(request.url())
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const demandaId = pathSegments[pathSegments.length - 1]

    if (method === 'GET') {
      const detalhe = state.detalhes[demandaId] ?? createDemandaDetalheFixture({ id: demandaId })
      state.detalhes[demandaId] = detalhe
      await fulfillJson(route, detalhe)
      return
    }

    if (method === 'PATCH') {
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

      const payload = safeParseJson<Record<string, any>>(request.postData()) ?? {}
      const index = state.demandas.findIndex((item) => item.id === demandaId)

      if (index === -1) {
        await route.fulfill({
          status: 404,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify({ message: 'Demanda não encontrada' }),
        })
        return
      }

      const atual = state.demandas[index]
      const atualizado: DemandaFixture = {
        ...atual,
        titulo: payload.titulo ?? atual.titulo,
        descricao:
          payload && Object.prototype.hasOwnProperty.call(payload, 'descricao')
            ? payload.descricao ?? null
            : atual.descricao,
        tipo: payload.tipo ?? atual.tipo,
        tipoLabel: payload.tipo ?? atual.tipoLabel,
        origem: payload.origem ?? atual.origem,
        origemLabel: payload.origem ?? atual.origemLabel,
        prioridade: payload.prioridade ?? atual.prioridade,
        prioridadeLabel: payload.prioridade ?? atual.prioridadeLabel,
        status: payload.status ?? atual.status,
        statusLabel: payload.status ?? atual.statusLabel,
        updatedAt: new Date().toISOString(),
      }

      state.demandas[index] = atualizado
      state.detalhes[demandaId] = {
        ...createDemandaDetalheFixture({ ...state.detalhes[demandaId], ...atualizado }),
        ...state.detalhes[demandaId],
        ...atualizado,
      }

      await fulfillJson(route, { message: 'Demanda atualizada com sucesso' })
      return
    }

    await route.continue()
  }

  await page.route('**/v1/demandas', listHandler)
  await page.route('**/v1/demandas/rapida', listHandler)
  await page.route('**/v1/demandas/*', detalheHandler)

  return {
    getDemandas: () => state.demandas.map((demanda) => ({ ...demanda })),
    setDemandas: (demandas) => {
      state.demandas = demandas.map((demanda) => ({ ...demanda }))
      demandas.forEach((demanda) => {
        state.detalhes[demanda.id] = state.detalhes[demanda.id] ?? createDemandaDetalheFixture(demanda)
      })
    },
    setDetalhe: (detalhe) => {
      state.detalhes[detalhe.id] = { ...detalhe }
    },
    failNextCreate: (error) => {
      state.failCreate = error
    },
    failNextUpdate: (error) => {
      state.failUpdate = error
    },
    getLastListQuery: () => (state.lastListQuery ? new URLSearchParams(state.lastListQuery) : null),
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
