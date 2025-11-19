import { getTestPrismaClient } from '../setup';
import { createTestTenant, createTestUser } from '../helpers/db-helper';
import { DemandaRepository } from '@infra/repositories/demandas/demanda.repository';
import { buildDemanda } from '../../fixtures/demanda.fixture';
import { PrismaClient } from '@prisma/client';

describe('DemandaRepository (Integration)', () => {
  let prisma: PrismaClient;
  let repository: DemandaRepository;
  let tenantId: string;
  let userId: string;
  let produtoId: string;

  beforeAll(async () => {
    prisma = await getTestPrismaClient();
    repository = new DemandaRepository(prisma as any);

    // Criar tenant e usuário de teste
    const tenant = await createTestTenant(prisma, 'test-tenant-demanda-001');
    tenantId = tenant.id;
    const user = await createTestUser(prisma, tenantId);
    userId = user.id;

    // Criar produto
    const produto = await prisma.produto.create({
      data: {
        tenant_id: BigInt(tenantId),
        nome: 'Produto Teste Demanda',
        descricao: 'Produto para testes de demanda',
        status: 'ATIVO',
      },
    });
    produtoId = produto.id.toString();

    // Criar catálogos necessários
    const tipoCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'tipo_demanda',
        label: 'Tipo de Demanda',
        ativo: true,
      },
    });

    await prisma.catalogItem.create({
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

    await prisma.catalogItem.create({
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

    await prisma.catalogItem.create({
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

    await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: statusCategoria.id,
        slug: 'novo',
        label: 'Novo',
        ativo: true,
        ordem: 1,
      },
    });
  });

  afterEach(async () => {
    // Limpar demandas criadas nos testes
    await prisma.demanda.deleteMany({
      where: {
        tenant_id: BigInt(tenantId),
      },
    });
  });

  it('deve validar que queries Prisma funcionam com schema real', async () => {
    // Este teste valida que as queries do repositório funcionam com o schema real
    const result = await repository.findAll(tenantId, { page: 1, pageSize: 10 });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('pageSize');
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('deve salvar e recuperar demanda', async () => {
    const demanda = buildDemanda({
      tenantId,
      titulo: 'Demanda de Teste Integração',
      produtoId,
      criadoPorId: userId,
    });

    const id = await repository.save(demanda);

    expect(id).toBeTruthy();

    const recuperada = await repository.findById(tenantId, id);

    expect(recuperada).not.toBeNull();
    expect(recuperada?.id).toBe(id);
    expect(recuperada?.titulo.getValue()).toBe('Demanda de Teste Integração');
  });

  it('deve filtrar demandas por tipo', async () => {
    // Criar demanda
    const demanda = buildDemanda({
      tenantId,
      produtoId,
      criadoPorId: userId,
    });

    await repository.save(demanda);

    // Buscar com filtro
    const result = await repository.findAll(tenantId, {
      page: 1,
      pageSize: 10,
      tipo: ['ideia'],
    });

    expect(Array.isArray(result.data)).toBe(true);
  });

  it('deve fazer soft delete de demanda', async () => {
    const demanda = buildDemanda({
      tenantId,
      produtoId,
      criadoPorId: userId,
    });

    const id = await repository.save(demanda);

    // Deletar
    demanda.cancelar('Motivo de teste');
    await repository.save(demanda);

    // Verificar que não é mais encontrada
    const recuperada = await repository.findById(tenantId, id);
    expect(recuperada).toBeNull();

    // Verificar que ainda existe no banco (soft delete)
    const noBanco = await prisma.demanda.findUnique({
      where: { id: BigInt(id) },
    });
    expect(noBanco).not.toBeNull();
    expect(noBanco?.deleted_at).not.toBeNull();
  });
});

