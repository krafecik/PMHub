import { expect, Page } from '@playwright/test'
import { mockAuthenticatedSession, mockAuthSession } from '../utils'

type NavigateOptions = {
  session?: typeof mockAuthSession
}

export async function navigateToProdutos(page: Page, options: NavigateOptions = {}): Promise<void> {
  const session = options.session ?? mockAuthSession

  await mockAuthenticatedSession(page, session)
  await page.goto('/produtos')
  await expect(page.getByRole('heading', { name: /Produtos/i })).toBeVisible()
}
