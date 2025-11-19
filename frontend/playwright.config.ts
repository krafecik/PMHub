import { defineConfig, devices } from '@playwright/test'
import * as path from 'path'

const PORT = Number(process.env.PORT) || 3056
const HOST = process.env.PLAYWRIGHT_HOST || '127.0.0.1'
const WEB_SERVER_URL = process.env.PLAYWRIGHT_BASE_URL || `http://${HOST}:${PORT}`

// Script wrapper para iniciar o Next.js
const startScript = path.join(__dirname, 'scripts', 'start-dev.js')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000, // 60s timeout global
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_SERVER_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // 15s para ações
    navigationTimeout: 30000, // 30s para navegação
  },
  // WebServer desabilitado devido a problemas com symlinks no Windows/OneDrive
  // Para rodar os testes, inicie o servidor manualmente: npm run dev
  // webServer: {
  //   command: `node "${startScript}" ${HOST} ${PORT}`,
  //   url: WEB_SERVER_URL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  //   cwd: __dirname,
  // },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

