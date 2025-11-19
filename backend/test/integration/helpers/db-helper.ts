import { PrismaClient } from '@prisma/client';
import { getTestPrismaClient } from '../setup';

/**
 * Helper para executar testes isolados em transações
 * Cada teste roda em uma transação que é revertida ao final
 */
export async function withTransaction<T>(
  callback: (prisma: PrismaClient) => Promise<T>,
): Promise<T> {
  const prisma = await getTestPrismaClient();

  // Usar transação isolada que será revertida
  return prisma.$transaction(async (tx) => {
    return callback(tx as PrismaClient);
  });
}

/**
 * Helper para limpar dados de teste de uma tabela específica
 * Útil para preparar estado antes de testes
 */
export async function truncateTable(tableName: string): Promise<void> {
  const prisma = await getTestPrismaClient();
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`);
}

/**
 * Helper para limpar múltiplas tabelas
 */
export async function truncateTables(tableNames: string[]): Promise<void> {
  const prisma = await getTestPrismaClient();
  const tables = tableNames.map((name) => `"${name}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE`);
}

/**
 * Helper para limpar todas as tabelas de teste (usar com cuidado)
 */
export async function truncateAllTables(): Promise<void> {
  const prisma = await getTestPrismaClient();

  // Obter lista de todas as tabelas
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `;

  if (tables.length > 0) {
    const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);
  }
}

/**
 * Helper para criar um tenant de teste
 */
export async function createTestTenant(
  prisma: PrismaClient,
  tenantId: string = 'test-tenant-001',
): Promise<{ id: string }> {
  // Verificar se o tenant já existe
  const existing = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (existing) {
    return existing;
  }

  return prisma.tenant.create({
    data: {
      id: tenantId,
      nome: 'Tenant de Teste',
      dominio: 'test.example.com',
      ativo: true,
    },
  });
}

/**
 * Helper para criar um usuário de teste
 */
export async function createTestUser(
  prisma: PrismaClient,
  tenantId: string,
  overrides: {
    id?: string;
    email?: string;
    nome?: string;
  } = {},
): Promise<{ id: string; email: string; nome: string }> {
  const userId = overrides.id || `test-user-${Date.now()}`;
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const nome = overrides.nome || 'Usuário de Teste';

  return prisma.usuario.create({
    data: {
      id: userId,
      email,
      nome,
      senhaHash: 'hashed-password',
      provider: 'LOCAL',
      status: 'ACTIVE',
      tenantId,
    },
  });
}

