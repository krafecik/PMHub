#!/usr/bin/env ts-node
/**
 * Script para aplicar a migração de deleted_at na tabela RegrasAutomacaoTriagem
 * 
 * Uso:
 *   npm run apply:deleted-at-migration
 *   ou
 *   ts-node scripts/apply-deleted-at-migration.ts
 */

import { PrismaClient } from '@prisma/client';

async function applyMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Aplicando migração: adicionando coluna deleted_at...\n');
    
    // Executar SQL diretamente
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RegrasAutomacaoTriagem" 
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
    `);
    
    console.log('✅ Migração aplicada com sucesso!');
    console.log('   Coluna deleted_at adicionada à tabela RegrasAutomacaoTriagem\n');
    
    // Verificar se a coluna foi criada
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'RegrasAutomacaoTriagem' 
      AND column_name = 'deleted_at';
    `);
    
    if (result.length > 0) {
      console.log('✅ Verificação: Coluna deleted_at existe no banco de dados');
    } else {
      console.log('⚠️  Aviso: Não foi possível verificar a coluna');
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  A coluna já existe. Nada a fazer.');
    } else {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

