import 'reflect-metadata';
import type { TokensBundle } from '@core/auth/jwt-token.service';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

const noop = () => undefined;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

afterAll(() => {
  jest.useRealTimers();
});

export const createMockLogger = () => ({
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn().mockReturnThis(),
});

export const createMockPrisma = () => ({
  $transaction: jest.fn(async <T>(handler?: () => Promise<T> | T) =>
    handler ? handler() : undefined,
  ),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(),
  $use: jest.fn(),
});

export const createMockTokensBundle = (overrides: Partial<TokensBundle> = {}): TokensBundle => ({
  accessToken: overrides.accessToken ?? 'access-token',
  refreshToken: overrides.refreshToken ?? 'refresh-token',
  expiresIn: overrides.expiresIn ?? 900,
});

jest.mock('@infra/telemetry', () => ({
  initializeTelemetry: noop,
  shutdownTelemetry: noop,
}));

export {};
