import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT) || 3056
const HOST = process.env.PLAYWRIGHT_HOST || '127.0.0.1'
const WEB_SERVER_URL = process.env.PLAYWRIGHT_BASE_URL || `http://${HOST}:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_SERVER_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --hostname ${HOST} --port ${PORT}`,
    url: WEB_SERVER_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

