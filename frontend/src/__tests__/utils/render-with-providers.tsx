import React, { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/providers/theme-provider'
import { createTestQueryClient } from './query-client'
import { MockRouter, createMockRouter, setMockRouter } from './router'

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  queryClient?: QueryClient
  router?: MockRouter
  theme?: 'light' | 'dark'
}

type WrapperProps = {
  children: ReactNode
}

export const renderWithProviders = (
  ui: ReactElement,
  { queryClient, router, theme = 'light', ...options }: RenderWithProvidersOptions = {},
) => {
  const testQueryClient = queryClient ?? createTestQueryClient()
  const mockRouter = router ?? createMockRouter()

  setMockRouter(mockRouter)

  const Wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={testQueryClient}>
      <ThemeProvider defaultTheme={theme} storageKey="test-theme">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )

  const rendered = render(ui, {
    wrapper: Wrapper,
    ...options,
  })

  return {
    ...rendered,
    queryClient: testQueryClient,
    router: mockRouter,
  }
}
