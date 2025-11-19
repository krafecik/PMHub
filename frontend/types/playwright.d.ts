import type {
  Page as PlaywrightPage,
  Route as PlaywrightRoute,
  Request as PlaywrightRequest,
} from '@playwright/test'

declare module '@playwright/test' {
  interface Route extends PlaywrightRoute {
    fulfill(options: Record<string, unknown>): Promise<void>
    continue(options?: Record<string, unknown>): Promise<void>
  }

  interface Request extends PlaywrightRequest {
    postDataJSON(): unknown
  }

  interface Page extends PlaywrightPage {
    route(
      url: string | RegExp,
      handler: (route: Route, request: Request) => Promise<void> | void,
    ): Promise<void>
  }
}

export {}

