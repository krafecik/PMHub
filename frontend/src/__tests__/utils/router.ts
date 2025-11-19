import { vi } from 'vitest'

export type MockRouter = {
  back: ReturnType<typeof vi.fn>
  forward: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
  prefetch: ReturnType<typeof vi.fn>
  push: ReturnType<typeof vi.fn>
  replace: ReturnType<typeof vi.fn>
  pathname: string
  params: Record<string, string>
  query: Record<string, string | string[]>
  searchParams: URLSearchParams
}

type RouterOverrides = Partial<Omit<MockRouter, 'searchParams'>> & {
  searchParams?: URLSearchParams | Record<string, string | number | boolean | undefined>
}

export const createMockSearchParams = (
  params: Record<string, string | number | boolean | undefined> = {},
): URLSearchParams => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    searchParams.set(key, String(value))
  })

  return searchParams
}

export const createMockRouter = (overrides: RouterOverrides = {}): MockRouter => {
  const searchParams =
    overrides.searchParams instanceof URLSearchParams
      ? overrides.searchParams
      : createMockSearchParams(
          overrides.searchParams as Record<string, string | number | boolean | undefined>,
        )

  return {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/',
    params: {},
    query: {},
    searchParams,
    ...overrides,
  }
}

let currentRouter: MockRouter = createMockRouter()

export const getMockRouter = (): MockRouter => currentRouter

export const setMockRouter = (router: MockRouter): void => {
  currentRouter = router
}

export const resetMockRouter = (): void => {
  currentRouter = createMockRouter()
}
