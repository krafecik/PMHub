import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const coverageEnabled =
  process.env.CI === 'true' || process.env.ENFORCE_VITEST_COVERAGE === 'true'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@tests': fileURLToPath(new URL('./src/__tests__', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    css: true,
    exclude: ['tests/e2e/**'],
    coverage: {
      enabled: coverageEnabled,
      provider: 'v8',
      reporter: ['text', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/**/stories/**',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
})
