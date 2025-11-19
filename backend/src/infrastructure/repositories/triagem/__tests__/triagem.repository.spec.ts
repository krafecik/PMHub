import { PrismaTriagemRepository } from '../triagem.repository';
import { TriagemDemanda } from '@domain/triagem';

const createPrismaMock = () => ({
  triagemDemanda: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  demanda: {
    findUnique: jest.fn(),
  },
});

describe('PrismaTriagemRepository', () => {
  const buildRepository = () => {
    const prisma = createPrismaMock();
    const catalogoRepository = {
      getRequiredItem: jest.fn(),
    };

    const repository = new PrismaTriagemRepository(prisma as any, catalogoRepository as any);
    return { repository, prisma, catalogoRepository };
  };

  const sampleDbRecord = () => {
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const updatedAt = new Date('2024-01-02T00:00:00Z');
    return {
      id: BigInt(1),
      demanda_id: BigInt(10),
      status: { slug: 'pendente_triagem' },
      impacto_slug: 'alto',
      urgencia_slug: 'alta',
      complexidade_slug: 'media',
      checklist_json: [],
      triado_por_id: BigInt(2),
      triado_em: updatedAt,
      revisoes_triagem: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  };

  it('findByTenantAndPeriodo converte registros do Prisma para domínio', async () => {
    const { repository, prisma } = buildRepository();
    prisma.triagemDemanda.findMany.mockResolvedValue([sampleDbRecord()]);

    const result = await repository.findByTenantAndPeriodo('1', undefined, undefined);

    expect(prisma.triagemDemanda.findMany).toHaveBeenCalledWith({
      where: { demanda: { tenant_id: BigInt('1') } },
      include: expect.any(Object),
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(TriagemDemanda);
    expect(result[0].statusTriagem.value).toBe('PENDENTE_TRIAGEM');
    expect(result[0].impacto?.value).toBe('ALTO');
    expect(result[0].urgencia?.value).toBe('ALTA');
  });

  it('create persiste triagem e retorna entidade', async () => {
    const { repository, prisma, catalogoRepository } = buildRepository();
    const triagem = TriagemDemanda.criarNova('10');
    prisma.demanda.findUnique.mockResolvedValue({ tenant_id: BigInt(1) });
    catalogoRepository.getRequiredItem.mockResolvedValue({
      id: BigInt(100),
      slug: 'pendente_triagem',
    });
    prisma.triagemDemanda.create.mockResolvedValue({
      ...sampleDbRecord(),
      status: { slug: 'pendente_triagem' },
    });

    const result = await repository.create(triagem);

    expect(prisma.triagemDemanda.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(TriagemDemanda);
    expect(result.demandaId).toBe('10');
  });
});

