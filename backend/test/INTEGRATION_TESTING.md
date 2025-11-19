# Testes de Integração - Detecção de Incompatibilidades Schema/DB

## Problema Identificado

Erros como `The column RegrasAutomacaoTriagem.deleted_at does not exist` não são detectados pelos testes atuais porque:

1. **Testes Unitários usam Mocks**: Os testes mockam o Prisma Client, então não validam se o schema está sincronizado com o banco
2. **Testes E2E mockam CommandBus/QueryBus**: Não executam queries reais no banco
3. **Falta validação de migrações**: Não há verificação se as migrações foram aplicadas corretamente

## Soluções Propostas

### 1. Testes de Integração com Banco Real

Criar testes que usam um banco de dados real (PostgreSQL em Docker ou banco de teste):

```typescript
// test/integration/repositories/regra-automacao.repository.integration.spec.ts
describe('RegraAutomacaoRepository (Integration)', () => {
  let prisma: PrismaService;
  let repository: RegraAutomacaoRepository;

  beforeAll(async () => {
    // Usa DATABASE_URL de teste
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new RegraAutomacaoRepository(prisma, catalogoRepository);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deve encontrar regras ativas por tenant', async () => {
    // Teste real com banco de dados
    const regras = await repository.findAtivasByTenant('1');
    expect(regras).toBeDefined();
  });
});
```

### 2. Validação de Schema vs Migrações

Script que valida se o schema do Prisma está sincronizado com as migrações:

```typescript
// scripts/validate-migrations.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

async function validateMigrations() {
  const prisma = new PrismaClient();
  
  try {
    // Tenta gerar o cliente Prisma
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Tenta conectar e fazer uma query simples em cada tabela
    await prisma.$connect();
    
    // Valida tabelas críticas
    await prisma.regrasAutomacaoTriagem.findFirst();
    
    console.log('✅ Schema sincronizado com banco de dados');
  } catch (error) {
    console.error('❌ Erro de sincronização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validateMigrations();
```

### 3. Teste de Migrações no CI

Adicionar no CI um passo que:
1. Aplica todas as migrações em um banco limpo
2. Valida que o schema está sincronizado
3. Executa testes de integração

```yaml
# .github/workflows/ci.yml
- name: Validate Migrations
  run: |
    npm run db:migrate
    npm run validate:migrations
    npm run test:integration
```

### 4. Pre-commit Hook para Validação

Validar antes de commitar:

```json
// package.json
{
  "scripts": {
    "validate:migrations": "ts-node scripts/validate-migrations.ts",
    "precommit": "npm run validate:migrations && npm run test"
  }
}
```

## Implementação Imediata

1. ✅ Criar script de validação de migrações
2. ✅ Adicionar teste de integração básico para repositórios críticos
3. ✅ Adicionar validação no CI
4. ✅ Documentar processo de validação

