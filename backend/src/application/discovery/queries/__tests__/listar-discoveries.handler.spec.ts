import { ListarDiscoveriesHandler } from '../listar-discoveries.query';
import { ListarDiscoveriesQuery } from '../listar-discoveries.query';
import { DiscoveryId } from '@domain/discovery/value-objects';
import { TenantId } from '@domain/shared/value-objects/tenant-id.vo';

describe('ListarDiscoveriesHandler', () => {
  const tenantId = 'tenant-1';

  const setup = () => {
    const discoveryRepository = {
      findAll: jest.fn(),
    };
    const hipoteseRepository = {
      countByDiscovery: jest.fn(),
    };
    const pesquisaRepository = {
      countByDiscovery: jest.fn(),
    };
    const insightRepository = {
      countByDiscovery: jest.fn(),
    };
    const experimentoRepository = {
      countByDiscovery: jest.fn(),
    };

    const handler = new ListarDiscoveriesHandler(
      discoveryRepository as any,
      hipoteseRepository as any,
      pesquisaRepository as any,
      insightRepository as any,
      experimentoRepository as any,
    );

    return {
      handler,
      discoveryRepository,
      hipoteseRepository,
      pesquisaRepository,
      insightRepository,
      experimentoRepository,
    };
  };

  it('mapeia filtros e paginação, retornando contagens agregadas', async () => {
    const {
      handler,
      discoveryRepository,
      hipoteseRepository,
      pesquisaRepository,
      insightRepository,
      experimentoRepository,
    } = setup();

    const discoveryIdValue = 'discovery-1';
    discoveryRepository.findAll.mockResolvedValue({
      items: [
        {
          id: { getValue: () => discoveryIdValue },
          demandaId: { getValue: () => 'demanda-1' },
          titulo: 'Discovery A',
          descricao: 'Descrição',
          status: { getValue: () => 'EM_PESQUISA', getLabel: () => 'Em Pesquisa', isFinal: () => false },
          produtoId: { getValue: () => 'produto-1' },
          responsavelId: { getValue: () => 'responsavel-1' },
          produtoNome: 'Produto XPTO',
          responsavelNome: 'Responsável',
          publicoAfetado: ['Enterprise'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    // Set counts for related entities
    hipoteseRepository.countByDiscovery.mockResolvedValue(2);
    pesquisaRepository.countByDiscovery.mockResolvedValue(3);
    insightRepository.countByDiscovery.mockResolvedValue(4);
    experimentoRepository.countByDiscovery.mockResolvedValue(1);

    const query = new ListarDiscoveriesQuery(
      tenantId,
      {
        status: ['EM_PESQUISA'],
        responsavelId: 'responsavel-1',
        produtoId: 'produto-1',
        criadoPorId: 'pm-1',
        searchTerm: 'relatório',
      },
      {
        page: 2,
        pageSize: 10,
        sortBy: 'titulo',
        sortOrder: 'asc',
      },
    );

    const result = await handler.execute(query);

    expect(discoveryRepository.findAll).toHaveBeenCalledWith(
      new TenantId(tenantId),
      expect.objectContaining({
        status: ['EM_PESQUISA'],
        responsavelId: 'responsavel-1',
        produtoId: 'produto-1',
        criadoPorId: 'pm-1',
        searchTerm: 'relatório',
      }),
      expect.objectContaining({
        page: 2,
        pageSize: 10,
        sortBy: 'titulo',
        sortOrder: 'asc',
      }),
    );

    expect(hipoteseRepository.countByDiscovery).toHaveBeenCalledWith(
      new TenantId(tenantId),
      new DiscoveryId(discoveryIdValue),
    );

    expect(result.items[0]).toMatchObject({
      id: discoveryIdValue,
      qtdHipoteses: 2,
      qtdPesquisas: 3,
      qtdInsights: 4,
      qtdExperimentos: 1,
    });
    expect(result.total).toBe(1);
  });

  it('retorna lista vazia quando não há discoveries', async () => {
    const { handler, discoveryRepository } = setup();
    discoveryRepository.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });

    const result = await handler.execute(new ListarDiscoveriesQuery(tenantId));

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

