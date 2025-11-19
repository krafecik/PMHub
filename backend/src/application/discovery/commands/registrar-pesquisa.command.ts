import { ICommand } from '@nestjs/cqrs';

export class RegistrarPesquisaCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly titulo: string,
    public readonly metodo: string,
    public readonly objetivo: string,
    public readonly roteiroUrl?: string,
    public readonly totalParticipantes: number = 0,
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Pesquisa } from '../../../domain/discovery/entities';
import { IPesquisaRepository, IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  DiscoveryId,
  MetodoPesquisaVO,
  StatusPesquisaVO,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(RegistrarPesquisaCommand)
export class RegistrarPesquisaHandler implements ICommandHandler<RegistrarPesquisaCommand> {
  private readonly logger = new Logger(RegistrarPesquisaHandler.name);

  constructor(
    @Inject('IPesquisaRepository')
    private readonly pesquisaRepository: IPesquisaRepository,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: RegistrarPesquisaCommand): Promise<string> {
    const { tenantId, discoveryId, titulo, metodo, objetivo, roteiroUrl, totalParticipantes } =
      command;

    if (!metodo || metodo.trim().length === 0) {
      throw new Error('Método de pesquisa é obrigatório');
    }

    // Validate that discovery exists and is active
    const discovery = await this.discoveryRepository.findById(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    if (!discovery) {
      throw new NotFoundException('Discovery não encontrado');
    }

    if (!discovery.isActive()) {
      throw new Error('Discovery não está ativo');
    }

    const metodoItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.METODO_PESQUISA,
      slug: normalizeCatalogSlug(metodo),
    });

    const statusItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_PESQUISA,
      slug: CatalogDefaultSlugs.STATUS_PESQUISA_PLANEJADA,
    });

    // Create pesquisa
    const pesquisa = Pesquisa.create({
      tenantId: new TenantId(tenantId),
      discoveryId: new DiscoveryId(discoveryId),
      titulo,
      metodo: MetodoPesquisaVO.fromCatalogItem(metodoItem),
      objetivo,
      roteiroUrl,
      status: StatusPesquisaVO.fromCatalogItem(statusItem),
      totalParticipantes,
    });

    // Save pesquisa
    const savedPesquisa = await this.pesquisaRepository.save(pesquisa);
    const pesquisaId = savedPesquisa.id?.getValue() ?? '';

    this.logger.log(`Pesquisa criada com ID: ${pesquisaId} para Discovery: ${discoveryId}`);

    return pesquisaId;
  }
}

const normalizeCatalogSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
