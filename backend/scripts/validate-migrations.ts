#!/usr/bin/env ts-node
/**
 * Script para validar se o schema do Prisma está sincronizado com o banco de dados
 * 
 * Este script:
 * 1. Gera o Prisma Client
 * 2. Tenta conectar ao banco
 * 3. Executa queries simples em tabelas críticas para detectar incompatibilidades
 * 
 * Uso:
 *   npm run validate:migrations
 *   ou
 *   ts-node scripts/validate-migrations.ts
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

const TABLES_TO_VALIDATE = [
  'regrasAutomacaoTriagem',
  'triagemDemanda',
  'demanda',
  'discovery',
] as const;

async function validateMigrations() {
  console.log('🔍 Validando sincronização do schema Prisma com o banco de dados...\n');

  // 1. Tentar gerar Prisma Client (pode falhar se o arquivo estiver em uso)
  console.log('📦 Verificando Prisma Client...');
  try {
    execSync('npx prisma generate', {
      stdio: 'pipe', // Não mostrar output para evitar poluição
      cwd: path.resolve(__dirname, '..'),
    });
    console.log('✅ Prisma Client atualizado\n');
  } catch (error: any) {
    // Se o erro for EPERM (arquivo em uso), apenas avisar mas continuar
    if (error.message?.includes('EPERM') || error.message?.includes('operation not permitted')) {
      console.log('⚠️  Prisma Client está em uso (servidor rodando?). Continuando com validação...\n');
    } else {
      console.warn('⚠️  Aviso: Não foi possível gerar Prisma Client. Continuando com validação...\n');
    }
  }

  // 2. Conectar e validar tabelas
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 3. Validar cada tabela crítica
    console.log('🔍 Validando tabelas críticas...\n');
    let hasErrors = false;

    for (const table of TABLES_TO_VALIDATE) {
      try {
        // Tenta fazer uma query simples (findFirst com take: 0 para não retornar dados)
        await (prisma as any)[table].findFirst({
          take: 0,
        });
        console.log(`✅ ${table} - OK`);
      } catch (error: any) {
        hasErrors = true;
        console.error(`❌ ${table} - ERRO:`);
        console.error(`   ${error.message}`);
        
        // Se for erro de coluna não encontrada, dar dica útil
        if (error.message?.includes('does not exist')) {
          console.error(`   💡 Dica: Execute as migrações pendentes: npm run db:migrate`);
        }
        console.error('');
      }
    }

    if (hasErrors) {
      console.error('\n❌ Validação falhou! Corrija os erros acima antes de continuar.');
      process.exit(1);
    }

    console.log('\n✅ Todas as tabelas estão sincronizadas!');
  } catch (error: any) {
    console.error('\n❌ Erro ao validar migrações:', error.message);
    if (error.message?.includes('P1001')) {
      console.error('💡 Dica: Verifique se o banco de dados está rodando e acessível');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar validação
validateMigrations().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

