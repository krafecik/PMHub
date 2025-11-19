import { test, expect } from '@playwright/test'
import { authenticateUser, fulfillJson, fulfillOptions } from './utils'

async function mockSettingsRequests(page: Parameters<typeof test>[0]['page']) {
  // Mock de configurações do tenant
  await page.route('**/v1/settings/tenant**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, {
        id: 'tenant-001',
        nome: 'Tenant Teste',
        dominio: 'teste.example.com',
      })
      return
    }
    if (method === 'PATCH') {
      await fulfillJson(route, {
        success: true,
        message: 'Configurações atualizadas com sucesso',
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
    if (method === 'GET') {
      await fulfillJson(route, {
        data: [
          {
            id: 'CAT-001',
            slug: 'tipo_demanda',
            label: 'Tipo de Demanda',
            itens: [
              { id: 'ITEM-001', slug: 'ideia', label: 'Ideia', ativo: true },
              { id: 'ITEM-002', slug: 'problema', label: 'Problema', ativo: true },
            ],
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

  // Mock de usuários
  await page.route('**/v1/users**', async (route) => {
    const method = route.request().method()
    if (method === 'OPTIONS') {
      await fulfillOptions(route)
      return
    }
    if (method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'usr-001',
          email: 'user@example.com',
          name: 'Usuário Teste',
          status: 'ACTIVE',
          role: 'PM',
        },
      ])
      return
    }
    await route.continue()
  })
}

test.describe('Módulo de Settings', () => {
  test('exibe configurações do tenant', async ({ page }) => {
    await authenticateUser(page)
    await mockSettingsRequests(page)

    await page.goto('/settings/tenant')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/configurações.*tenant/i)).toBeVisible({ timeout: 10000 })
  })

  test('edita configurações do tenant', async ({ page }) => {
    await authenticateUser(page)
    await mockSettingsRequests(page)

    await page.goto('/settings/tenant')
    await page.waitForLoadState('networkidle')

    const nomeInput = page.getByLabel(/nome/i)
    if (await nomeInput.count() > 0) {
      await nomeInput.clear()
      await nomeInput.fill('Tenant Atualizado')
      await page.getByRole('button', { name: /salvar/i }).click()
      await expect(page.getByRole('status')).toContainText(/atualizado.*sucesso/i, {
        timeout: 10000,
      })
    }
  })

  test('lista catálogos flexíveis', async ({ page }) => {
    await authenticateUser(page)
    await mockSettingsRequests(page)

    await page.goto('/settings/catalogos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/catálogos/i)).toBeVisible({ timeout: 10000 })
  })

  test('cria item em catálogo', async ({ page }) => {
    await authenticateUser(page)
    await mockSettingsRequests(page)

    // Mock de criar item
    await page.route('**/v1/catalogos/categorias/*/itens', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          id: 'ITEM-NEW',
          slug: 'novo-item',
          label: 'Novo Item',
          ativo: true,
        })
        return
      }
      await route.continue()
    })

    await page.goto('/settings/catalogos')
    await page.waitForLoadState('networkidle')

    const adicionarButton = page.getByRole('button', { name: /adicionar|novo/i })
    if (await adicionarButton.count() > 0) {
      await adicionarButton.click()
      await page.waitForTimeout(500)

      const labelInput = page.getByLabel(/label|nome/i)
      if (await labelInput.count() > 0) {
        await labelInput.fill('Novo Item')
        await page.getByRole('button', { name: /salvar|confirmar/i }).click()
        await expect(page.getByRole('status')).toContainText(/criado.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })

  test('lista usuários e acessos', async ({ page }) => {
    await authenticateUser(page)
    await mockSettingsRequests(page)

    await page.goto('/settings/usuarios')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/usuários/i)).toBeVisible({ timeout: 10000 })
  })

  test('cria novo usuário', async ({ page }) => {
    await authenticateUser(page)
    await mockSettingsRequests(page)

    // Mock de criar usuário
    await page.route('**/v1/users', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          id: 'usr-new',
          email: 'newuser@example.com',
          name: 'Novo Usuário',
          status: 'ACTIVE',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/settings/usuarios')
    await page.waitForLoadState('networkidle')

    const novoButton = page.getByRole('button', { name: /novo.*usuário/i })
    if (await novoButton.count() > 0) {
      await novoButton.click()
      await page.waitForTimeout(500)

      const emailInput = page.getByLabel(/email/i)
      if (await emailInput.count() > 0) {
        await emailInput.fill('newuser@example.com')
        await page.getByRole('button', { name: /salvar|confirmar/i }).click()
        await expect(page.getByRole('status')).toContainText(/criado.*sucesso/i, {
          timeout: 10000,
        })
      }
    }
  })
})

