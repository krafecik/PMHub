import { EventBus } from '@nestjs/cqrs';
import { CriarDiscoveryHandler } from '../criar-discovery.command';
import { CriarDiscoveryCommand } from '../criar-discovery.command';
import { IDiscoveryRepository } from '@domain/discovery/repositories';
import { ICatalogoRepository } from '@domain/catalog/catalog.repository.interface';
import { Discovery } from '@domain/discovery/entities';
import { createCatalogItem } from '../../../../../test/fixtures';

jest.mock('@nestjs/common', () => ({
  ...(jest.requireActual('@nestjs/common') as object),
  Logger: class {
    log() {
      /* noop */
    }
  },
}));

describe('CriarDiscoveryHandler', () => {
  const setup = () => {
    const discoveryRepository: jest.Mocked<IDiscoveryRepository> = {
      findByDemandaId: jest.fn(),
      save: jest.fn(),
    } as any;

    const eventBus: jest.Mocked<EventBus> = {
      publish: jest.fn(),
    } as any;

    const catalogoRepository: jest.Mocked<ICatalogoRepository> = {
      getRequiredItem: jest.fn(),
    } as any;

    const handler = new CriarDiscoveryHandler(discoveryRepository, eventBus, catalogoRepository);
    return { handler, discoveryRepository, eventBus, catalogoRepository };
  };

  const command = new CriarDiscoveryCommand(
    'tenant-1',
    'demanda-1',
    'Discovery Teste',
    'Descrição detalhada',
    'pm-1',
    'responsavel-1',
    'produto-1',
    'Contexto rico',
    ['Clientes Enterprise'],
    '500 usuários',
    'alto',
    ['analytics'],
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cria discovery e publica evento quando não existe previamente', async () => {
    const { handler, discoveryRepository, eventBus, catalogoRepository } = setup();

    discoveryRepository.findByDemandaId.mockResolvedValue(undefined);
    const statusItem = createCatalogItem({
      categorySlug: 'status_discovery',
      slug: 'em_pesquisa',
      label: 'Em Pesquisa',
    });
    const severidadeItem = createCatalogItem({
      categorySlug: 'severidade_problema',
      slug: 'alto',
      label: 'Alto',
    });

    catalogoRepository.getRequiredItem.mockResolvedValueOnce(statusItem);
    catalogoRepository.getRequiredItem.mockResolvedValueOnce(severidadeItem);

    const discoveryInstance = {
      id: { getValue: () => 'discovery-xyz' },
    } as unknown as Discovery;

    jest.spyOn(Discovery, 'create').mockReturnValue(discoveryInstance);
    discoveryRepository.save.mockResolvedValue(discoveryInstance);

    const resultId = await handler.execute(command);

    expect(discoveryRepository.save).toHaveBeenCalledWith(discoveryInstance);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        discoveryId: 'discovery-xyz',
        demandaId: command.demandaId,
      }),
    );
    expect(resultId).toBe('discovery-xyz');
  });

  it('lança erro quando já existe discovery para a demanda', async () => {
    const { handler, discoveryRepository } = setup();
    discoveryRepository.findByDemandaId.mockResolvedValue({} as Discovery);

    await expect(handler.execute(command)).rejects.toThrow(
      'Já existe um discovery para esta demanda',
    );
  });
});

