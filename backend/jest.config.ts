import type { Config } from 'jest';

const moduleNameMapper = {
  '^@application/(.*)$': '<rootDir>/src/application/$1',
  '^@core/(.*)$': '<rootDir>/src/core/$1',
  '^@domain/(.*)$': '<rootDir>/src/domain/$1',
  '^@infra/(.*)$': '<rootDir>/src/infrastructure/$1',
  '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
  '^@config/(.*)$': '<rootDir>/src/config/$1',
};

const transform: Config['transform'] = {
  '^.+\\.(t|j)s$': [
    'ts-jest',
    { tsconfig: '<rootDir>/tsconfig.json', diagnostics: false },
  ],
};

const setupFilesAfterEnv = ['<rootDir>/test/setup.ts'];

const enforceCoverage =
  process.env.CI === 'true' || process.env.ENFORCE_JEST_COVERAGE === 'true';

const coverageThreshold = enforceCoverage
  ? {
      global: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      'src/domain/': {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
      'src/application/': {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    }
  : undefined;

const config: Config = {
  testTimeout: 30000,
  collectCoverage: enforceCoverage,
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'cobertura'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/config/',
    '<rootDir>/src/infrastructure/database/',
    '<rootDir>/src/**/__mocks__/',
  ],
  coverageThreshold,
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      moduleNameMapper,
      transform,
      setupFilesAfterEnv,
      testPathIgnorePatterns: ['<rootDir>/dist/', '/node_modules/'],
      collectCoverageFrom: [
        '<rootDir>/src/**/*.ts',
        '!<rootDir>/src/main.ts',
        '!<rootDir>/src/**/index.ts',
        '!<rootDir>/src/**/*.module.ts',
      ],
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      moduleNameMapper,
      transform,
      setupFilesAfterEnv,
      testPathIgnorePatterns: ['<rootDir>/dist/', '/node_modules/'],
    },
  ],
};

export default config;
