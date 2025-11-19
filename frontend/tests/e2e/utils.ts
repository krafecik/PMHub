import { expect, type Page, type Route, type Request } from '@playwright/test'

const DEFAULT_ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3056'

function buildCorsHeaders(origin?: string) {
  const allowOrigin = origin ?? DEFAULT_ORIGIN
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type,Authorization,X-Tenant-Id',
  }
}

export const mockAuthSession = {
  user: {
    id: 'user-001',
    email: 'pm@example.com',
    nome: 'PM de Teste',
    tenants: [
      {
        id: 'tenant-001',
        nome: 'Tenant Demo',
        role: 'PM',
      },
    ],
  },
  tokens: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  },
  defaultTenantId: 'tenant-001',
}

export async function fulfillOptions(route: Route) {
  const origin = route.request().headers()['origin'] ?? DEFAULT_ORIGIN
  await route.fulfill({
    status: 204,
    headers: buildCorsHeaders(origin),
  })
}

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  const origin = route.request().headers()['origin'] ?? DEFAULT_ORIGIN
  const corsHeaders = buildCorsHeaders(origin)
  const jsonHeaders = {
    ...corsHeaders,
    'content-type': 'application/json',
  }
  await route.fulfill({
    status,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  })
}

type JsonResponder = (request: Request) => unknown | Promise<unknown>

export async function routeJson(
  page: Page,
  url: string | RegExp,
  responder: unknown | JsonResponder,
  status = 200,
) {
  await page.route(url, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    const payload =
      typeof responder === 'function' ? await (responder as JsonResponder)(route.request()) : responder

    await fulfillJson(route, payload, status)
  })
}

export async function mockAuthenticatedSession(page: Page, session = mockAuthSession) {
  await routeJson(page, '**/v1/auth/refresh', session)
}

export async function authenticateUser(page: Page, session = mockAuthSession) {
  await mockAuthenticatedSession(page, session)

  await page.route('**/v1/auth/login', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }

    if (route.request().method() === 'POST') {
      await fulfillJson(route, session)
      return
    }

    await route.continue()
  })

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(session.user.email)
  await page.getByLabel('Senha').fill('senhaSegura123')
  await page.getByRole('button', { name: /entrar/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

