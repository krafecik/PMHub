import { QueryClient, type QueryClientConfig } from '@tanstack/react-query'

const silentLogger: NonNullable<QueryClientConfig['logger']> = {
  log: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}

export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    logger: silentLogger,
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

export const resetTestQueryClient = (client: QueryClient): void => {
  client.clear()
  client.getQueryCache().clear()
  client.getMutationCache().clear()
}
