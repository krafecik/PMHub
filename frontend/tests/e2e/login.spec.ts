import { test, expect } from '@playwright/test'
import { fulfillOptions, fulfillJson, mockAuthenticatedSession, mockAuthSession } from './utils'

test.describe('Página de Login', () => {
  test('exibe formulário de autenticação e CTA principal', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()

    // Ajuda contextual conforme diretrizes do produto
    await expect(page.getByRole('link', { name: /esqueci minha senha/i })).toBeVisible()
  })

  test('permite autenticação com credenciais válidas e redireciona para o dashboard', async ({
    page,
  }) => {
    await mockAuthenticatedSession(page)

    await page.route('**/v1/auth/login', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      await fulfillJson(route, mockAuthSession)
    })

    await page.goto('/login')

    await page.getByLabel('E-mail').fill('pm@example.com')
    await page.getByLabel('Senha').fill('senhaSegura123')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /Olá, PM/ })).toBeVisible()
  })
})

