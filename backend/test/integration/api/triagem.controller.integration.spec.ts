import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TriagemModule } from '@infra/modules/triagem.module';
import { getTestPrismaClient, TEST_DATABASE_URL } from '../setup';
import { createTestTenant, createTestUser } from '../helpers/db-helper';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

describe('TriagemController (Integration - Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let tenantId: string;
  let userId: string;
  let demandaId: string;
  let authToken: string;

  beforeAll(async () => {
    prisma = await getTestPrismaClient();

    // Criar tenant e usuário de teste
    const tenant = await createTestTenant(prisma, 'test-tenant-triagem-e2e-001');
    tenantId = tenant.id;
    const user = await createTestUser(prisma, tenantId, {
      email: 'pm@test.com',
      nome: 'PM Teste',
    });
    userId = user.id;

    // Criar produto
    const produto = await prisma.produto.create({
      data: {
        tenant_id: BigInt(tenantId),
        nome: 'Produto Teste E2E',
        descricao: 'Produto para testes E2E',
        status: 'ATIVO',
      },
    });

    // Criar catálogos necessários
    const tipoCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'tipo_demanda',
        label: 'Tipo de Demanda',
        ativo: true,
      },
    });

    const tipoItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: tipoCategoria.id,
        slug: 'ideia',
        label: 'Ideia',
        ativo: true,
        ordem: 1,
      },
    });

    const origemCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'origem_demanda',
        label: 'Origem de Demanda',
        ativo: true,
      },
    });

    const origemItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: origemCategoria.id,
        slug: 'cliente',
        label: 'Cliente',
        ativo: true,
        ordem: 1,
      },
    });

    const prioridadeCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'prioridade_nivel',
        label: 'Prioridade',
        ativo: true,
      },
    });

    const prioridadeItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: prioridadeCategoria.id,
        slug: 'alta',
        label: 'Alta',
        ativo: true,
        ordem: 1,
      },
    });

    const statusCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'status_demanda',
        label: 'Status de Demanda',
        ativo: true,
      },
    });

    const statusItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: statusCategoria.id,
        slug: 'novo',
        label: 'Novo',
        ativo: true,
        ordem: 1,
      },
    });

    // Criar demanda de teste
    const demanda = await prisma.demanda.create({
      data: {
        tenant_id: BigInt(tenantId),
        titulo: 'Demanda para Triagem E2E',
        descricao: 'Descrição completa da demanda para teste E2E de triagem com pelo menos 20 palavras para atender aos requisitos do checklist.',
        tipo_id: tipoItem.id,
        produto_id: produto.id,
        origem_id: origemItem.id,
        prioridade_id: prioridadeItem.id,
        status_id: statusItem.id,
        criado_por_id: BigInt(userId),
      },
    });

    demandaId = demanda.id.toString();

    // Configurar DATABASE_URL para testes
    process.env.DATABASE_URL = TEST_DATABASE_URL;

    // Criar módulo de teste com banco real
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: false,
          ignoreEnvFile: true,
        }),
        TriagemModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: userId, defaultTenantId: tenantId };
          req.tenantId = tenantId;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Gerar token de autenticação (simulado)
    authToken = 'test-token';
  });

  afterEach(async () => {
    // Limpar triagens criadas nos testes
    await prisma.triagemDemanda.deleteMany({
      where: {
        demanda_id: BigInt(demandaId),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/triagem/demandas-pendentes deve retornar demandas do banco real', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/triagem/demandas-pendentes')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('PATCH /v1/triagem/demandas/:id/triar deve salvar triagem no banco real', async () => {
    // Criar catálogos de triagem
    const statusTriagemCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'status_triagem',
        label: 'Status de Triagem',
        ativo: true,
      },
    });

    await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: statusTriagemCategoria.id,
        slug: 'pronto_discovery',
        label: 'Pronto para Discovery',
        ativo: true,
        ordem: 1,
        metadados: { legacyValue: 'PRONTO_DISCOVERY' },
      },
    });

    const impactoCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'impacto_triagem',
        label: 'Impacto',
        ativo: true,
      },
    });

    await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: impactoCategoria.id,
        slug: 'alto',
        label: 'Alto',
        ativo: true,
        ordem: 1,
        metadados: { legacyValue: 'ALTO' },
      },
    });

    const urgenciaCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'urgencia_triagem',
        label: 'Urgência',
        ativo: true,
      },
    });

    await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: urgenciaCategoria.id,
        slug: 'media',
        label: 'Média',
        ativo: true,
        ordem: 1,
        metadados: { legacyValue: 'MEDIA' },
      },
    });

    const complexidadeCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'complexidade_triagem',
        label: 'Complexidade',
        ativo: true,
      },
    });

    await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: complexidadeCategoria.id,
        slug: 'baixa',
        label: 'Baixa',
        ativo: true,
        ordem: 1,
        metadados: { legacyValue: 'BAIXA' },
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/v1/triagem/demandas/${demandaId}/triar`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        novoStatus: 'PRONTO_DISCOVERY',
        impacto: 'ALTO',
        urgencia: 'MEDIA',
        complexidade: 'BAIXA',
      })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);

    // Verificar que a triagem foi salva no banco
    const triagemNoBanco = await prisma.triagemDemanda.findFirst({
      where: {
        demanda_id: BigInt(demandaId),
      },
    });

    expect(triagemNoBanco).not.toBeNull();
    expect(triagemNoBanco?.status_triagem_slug).toBe('pronto_discovery');
  });

  it('GET /v1/triagem/estatisticas deve retornar estatísticas do banco real', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/triagem/estatisticas')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('totalPendentes');
    expect(typeof response.body.totalPendentes).toBe('number');
  });
});

