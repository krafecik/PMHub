import { getTestPrismaClient } from '../setup';
import { createTestTenant, createTestUser } from '../helpers/db-helper';
import { PrismaTriagemRepository } from '@infra/repositories/triagem/triagem.repository';
import { CatalogoRepository } from '@infra/repositories/catalog/catalog.repository';
import { PrismaClient } from '@prisma/client';

describe('PrismaTriagemRepository (Integration)', () => {
  let prisma: PrismaClient;
  let repository: PrismaTriagemRepository;
  let catalogoRepository: CatalogoRepository;
  let tenantId: string;
  let userId: string;
  let demandaId: string;

  beforeAll(async () => {
    prisma = await getTestPrismaClient();
    catalogoRepository = new CatalogoRepository(prisma as any);
    repository = new PrismaTriagemRepository(prisma as any, catalogoRepository);

    // Criar tenant e usuário de teste
    const tenant = await createTestTenant(prisma, 'test-tenant-triagem-001');
    tenantId = tenant.id;
    const user = await createTestUser(prisma, tenantId);
    userId = user.id;

    // Criar produto para a demanda
    const produto = await prisma.produto.create({
      data: {
        tenant_id: BigInt(tenantId),
        nome: 'Produto Teste Triagem',
        descricao: 'Produto para testes de triagem',
        status: 'ATIVO',
      },
    });

    // Criar catálogos básicos
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
        titulo: 'Demanda para Triagem',
        descricao: 'Descrição da demanda para teste de triagem',
        tipo_id: tipoItem.id,
        produto_id: produto.id,
        origem_id: origemItem.id,
        prioridade_id: prioridadeItem.id,
        status_id: statusItem.id,
        criado_por_id: BigInt(userId),
      },
    });

    demandaId = demanda.id.toString();
  });

  afterEach(async () => {
    // Limpar triagens criadas nos testes
    await prisma.triagemDemanda.deleteMany({
      where: {
        demanda_id: BigInt(demandaId),
      },
    });
  });

  it('deve validar que queries Prisma funcionam com schema real', async () => {
    // Este teste valida que as queries do repositório funcionam com o schema real
    // Se alguma coluna não existir, o Prisma lançará erro

    const triagem = await repository.findByDemandaId(demandaId, tenantId);
    // Pode ser null se não existir, mas não deve lançar erro de schema
    expect(triagem === null || typeof triagem === 'object').toBe(true);
  });

  it('deve criar e recuperar triagem', async () => {
    // Criar catálogos de triagem
    const statusTriagemCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'status_triagem',
        label: 'Status de Triagem',
        ativo: true,
      },
    });

    const statusTriagemItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: statusTriagemCategoria.id,
        slug: 'pendente_triagem',
        label: 'Pendente Triagem',
        ativo: true,
        ordem: 1,
        metadados: { legacyValue: 'PENDENTE_TRIAGEM' },
      },
    });

    // Criar triagem diretamente no banco para testar recuperação
    const triagemData = await prisma.triagemDemanda.create({
      data: {
        demanda_id: BigInt(demandaId),
        status_triagem_slug: 'pendente_triagem',
        checklist_json: [],
        triado_por_id: BigInt(userId),
        triado_em: new Date(),
      },
    });

    const triagem = await repository.findById(triagemData.id.toString());

    expect(triagem).not.toBeNull();
    expect(triagem?.demandaId).toBe(demandaId);
  });

  it('deve listar triagens por tenant e período', async () => {
    const triagens = await repository.findByTenantAndPeriodo(tenantId);

    // Deve retornar array (pode estar vazio)
    expect(Array.isArray(triagens)).toBe(true);
  });
});

