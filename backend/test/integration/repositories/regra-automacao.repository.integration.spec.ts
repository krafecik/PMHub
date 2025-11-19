import { getTestPrismaClient } from '../setup';
import { createTestTenant, createTestUser } from '../helpers/db-helper';
import { RegraAutomacaoRepository } from '@infra/repositories/automacao/regra-automacao.repository';
import { CatalogoRepository } from '@infra/repositories/catalog/catalog.repository';
import { RegraAutomacao } from '@domain/automacao/entities/regra-automacao.entity';
import { PrismaClient } from '@prisma/client';

describe('RegraAutomacaoRepository (Integration)', () => {
  let prisma: PrismaClient;
  let repository: RegraAutomacaoRepository;
  let catalogoRepository: CatalogoRepository;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    prisma = await getTestPrismaClient();
    catalogoRepository = new CatalogoRepository(prisma as any);
    repository = new RegraAutomacaoRepository(prisma as any, catalogoRepository);

    // Criar tenant e usuário de teste
    const tenant = await createTestTenant(prisma, 'test-tenant-regra-001');
    tenantId = tenant.id;
    const user = await createTestUser(prisma, tenantId);
    userId = user.id;
  });

  afterEach(async () => {
    // Limpar regras criadas nos testes
    await prisma.regrasAutomacaoTriagem.deleteMany({
      where: {
        id_tenant: BigInt(tenantId),
      },
    });
  });

  it('deve salvar e recuperar regra de automação', async () => {
    // Criar catálogos necessários para a regra
    const categoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'automacao_campos',
        label: 'Campos de Automação',
        ativo: true,
      },
    });

    const campoItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: categoria.id,
        slug: 'tipo_demanda',
        label: 'Tipo de Demanda',
        ativo: true,
        ordem: 1,
      },
    });

    const operadorItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: categoria.id,
        slug: 'igual',
        label: 'Igual',
        ativo: true,
        ordem: 1,
      },
    });

    const acaoCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'automacao_acoes',
        label: 'Ações de Automação',
        ativo: true,
      },
    });

    const acaoItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: acaoCategoria.id,
        slug: 'definir_impacto',
        label: 'Definir Impacto',
        ativo: true,
        ordem: 1,
      },
    });

    // Criar regra usando a entidade de domínio
    const regra = RegraAutomacao.criar({
      tenantId,
      nome: 'Regra de Teste',
      descricao: 'Regra criada para teste de integração',
      criadoPor: userId,
      condicoes: [
        {
          campo: {
            id: campoItem.id.toString(),
            slug: campoItem.slug,
            label: campoItem.label,
          },
          operador: {
            id: operadorItem.id.toString(),
            slug: operadorItem.slug,
            label: operadorItem.label,
          },
          valor: 'IDEIA',
          logica: 'E',
        },
      ],
      acoes: [
        {
          tipo: {
            id: acaoItem.id.toString(),
            slug: acaoItem.slug,
            label: acaoItem.label,
          },
          valor: 'ALTO',
        },
      ],
    });

    // Salvar
    await repository.save(regra);

    // Recuperar
    const recuperada = await repository.findById(tenantId, regra.id);

    expect(recuperada).not.toBeNull();
    expect(recuperada?.id).toBe(regra.id);
    expect(recuperada?.nome).toBe('Regra de Teste');
    expect(recuperada?.tenantId).toBe(tenantId);
  });

  it('deve listar regras ativas por tenant', async () => {
    // Criar catálogos básicos
    const categoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'automacao_campos',
        label: 'Campos',
        ativo: true,
      },
    });

    const campoItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: categoria.id,
        slug: 'campo_teste',
        label: 'Campo Teste',
        ativo: true,
        ordem: 1,
      },
    });

    const operadorItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: categoria.id,
        slug: 'operador_teste',
        label: 'Operador Teste',
        ativo: true,
        ordem: 1,
      },
    });

    const acaoCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'automacao_acoes',
        label: 'Ações',
        ativo: true,
      },
    });

    const acaoItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: acaoCategoria.id,
        slug: 'acao_teste',
        label: 'Ação Teste',
        ativo: true,
        ordem: 1,
      },
    });

    // Criar duas regras: uma ativa e uma inativa
    const regraAtiva = RegraAutomacao.criar({
      tenantId,
      nome: 'Regra Ativa',
      criadoPor: userId,
      condicoes: [
        {
          campo: {
            id: campoItem.id.toString(),
            slug: campoItem.slug,
            label: campoItem.label,
          },
          operador: {
            id: operadorItem.id.toString(),
            slug: operadorItem.slug,
            label: operadorItem.label,
          },
          valor: 'teste',
          logica: 'E',
        },
      ],
      acoes: [
        {
          tipo: {
            id: acaoItem.id.toString(),
            slug: acaoItem.slug,
            label: acaoItem.label,
          },
          valor: 'teste',
        },
      ],
    });

    const regraInativa = RegraAutomacao.criar({
      tenantId,
      nome: 'Regra Inativa',
      criadoPor: userId,
      ativo: false, // Criar já inativa
      condicoes: [
        {
          campo: {
            id: campoItem.id.toString(),
            slug: campoItem.slug,
            label: campoItem.label,
          },
          operador: {
            id: operadorItem.id.toString(),
            slug: operadorItem.slug,
            label: operadorItem.label,
          },
          valor: 'teste',
          logica: 'E',
        },
      ],
      acoes: [
        {
          tipo: {
            id: acaoItem.id.toString(),
            slug: acaoItem.slug,
            label: acaoItem.label,
          },
          valor: 'teste',
        },
      ],
    });

    await repository.save(regraAtiva);
    await repository.save(regraInativa);

    // Buscar apenas ativas
    const regrasAtivas = await repository.findAtivasByTenant(tenantId);

    expect(regrasAtivas).toHaveLength(1);
    expect(regrasAtivas[0].id).toBe(regraAtiva.id);
    expect(regrasAtivas[0].ativo).toBe(true);
  });

  it('deve fazer soft delete de regra', async () => {
    // Criar catálogos básicos
    const categoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'automacao_campos',
        label: 'Campos',
        ativo: true,
      },
    });

    const campoItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: categoria.id,
        slug: 'campo_teste',
        label: 'Campo Teste',
        ativo: true,
        ordem: 1,
      },
    });

    const operadorItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: categoria.id,
        slug: 'operador_teste',
        label: 'Operador Teste',
        ativo: true,
        ordem: 1,
      },
    });

    const acaoCategoria = await prisma.catalogCategory.create({
      data: {
        tenant_id: BigInt(tenantId),
        slug: 'automacao_acoes',
        label: 'Ações',
        ativo: true,
      },
    });

    const acaoItem = await prisma.catalogItem.create({
      data: {
        tenant_id: BigInt(tenantId),
        categoria_id: acaoCategoria.id,
        slug: 'acao_teste',
        label: 'Ação Teste',
        ativo: true,
        ordem: 1,
      },
    });

    const regra = RegraAutomacao.criar({
      tenantId,
      nome: 'Regra para Deletar',
      criadoPor: userId,
      condicoes: [
        {
          campo: {
            id: campoItem.id.toString(),
            slug: campoItem.slug,
            label: campoItem.label,
          },
          operador: {
            id: operadorItem.id.toString(),
            slug: operadorItem.slug,
            label: operadorItem.label,
          },
          valor: 'teste',
          logica: 'E',
        },
      ],
      acoes: [
        {
          tipo: {
            id: acaoItem.id.toString(),
            slug: acaoItem.slug,
            label: acaoItem.label,
          },
          valor: 'teste',
        },
      ],
    });

    await repository.save(regra);

    // Deletar
    await repository.delete(tenantId, regra.id);

    // Verificar que não é mais encontrada
    const recuperada = await repository.findById(tenantId, regra.id);
    expect(recuperada).toBeNull();

    // Verificar que ainda existe no banco (soft delete)
    const noBanco = await prisma.regrasAutomacaoTriagem.findUnique({
      where: { id: regra.id },
    });
    expect(noBanco).not.toBeNull();
    expect(noBanco?.deleted_at).not.toBeNull();
  });

  it('deve validar que colunas obrigatórias existem no schema', async () => {
    // Este teste valida que as queries Prisma funcionam com o schema real
    // Se alguma coluna não existir, o Prisma lançará erro

    const regras = await repository.findByTenant(tenantId);
    expect(Array.isArray(regras)).toBe(true);
  });
});

