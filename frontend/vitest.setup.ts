import '@testing-library/jest-dom'
import React from 'react'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { getMockRouter, resetMockRouter } from './src/__tests__/utils/router'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  resetMockRouter()
})

const createMatchMedia = () => (query: string) => ({
  matches: false,
  media: query,
  onchange: null as ((event: MediaQueryListEvent) => void) | null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: createMatchMedia(),
  })
}

class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

if (!window.ResizeObserver) {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  })
}

class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn()
}

if (!window.IntersectionObserver) {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  })
}

if (!window.scrollTo) {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn() as unknown as typeof HTMLElement.prototype.scrollIntoView
}

vi.mock('next/navigation', () => ({
  useRouter: () => getMockRouter(),
  usePathname: () => getMockRouter().pathname,
  useSearchParams: () => getMockRouter().searchParams,
  useParams: () => ({ ...getMockRouter().params }),
  useSelectedLayoutSegments: () => [],
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: React.forwardRef<
    HTMLAnchorElement,
    { href: string; className?: string; children: React.ReactNode }
  >(({ href, children, ...rest }, ref) =>
    React.createElement(
      'a',
      {
        ref,
        href,
        ...rest,
      },
      children,
    ),
  ),
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement('img', {
      ...props,
      alt: props.alt ?? '',
      src: typeof props.src === 'string' ? props.src : props?.src?.src ?? '',
    }),
}))
