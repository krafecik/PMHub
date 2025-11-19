import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

// Garantir que NODE_ENV está definido
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

// DATABASE_URL para testes de integração
// Deve apontar para um banco de teste isolado
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/cpopm_test') ||
  'postgresql://postgres:postgres@localhost:5432/cpopm_test';

// Prisma Client global para testes de integração
let prisma: PrismaClient | null = null;

export async function getTestPrismaClient(): Promise<PrismaClient> {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL,
        },
      },
    });
    await prisma.$connect();
  }
  return prisma;
}

export async function closeTestPrismaClient(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Configurar timeout global para testes de integração (60s)
jest.setTimeout(60000);

// Setup global antes de todos os testes de integração
beforeAll(async () => {
  // Verificar se o banco de teste está acessível
  try {
    const client = await getTestPrismaClient();
    await client.$queryRaw`SELECT 1`;
    console.log('✅ Banco de teste conectado:', TEST_DATABASE_URL);
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de teste:', error);
    throw new Error(
      `Não foi possível conectar ao banco de teste. Verifique se o PostgreSQL está rodando e acessível em ${TEST_DATABASE_URL}`,
    );
  }
});

// Cleanup global após todos os testes
afterAll(async () => {
  await closeTestPrismaClient();
});

// Limpar mocks entre testes
beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

// Desabilitar telemetria em testes
jest.mock('@infra/telemetry', () => ({
  initializeTelemetry: jest.fn(),
  shutdownTelemetry: jest.fn(),
}));

export { TEST_DATABASE_URL };

