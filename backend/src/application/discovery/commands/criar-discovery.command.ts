import { ICommand } from '@nestjs/cqrs';

export class CriarDiscoveryCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly titulo: string,
    public readonly descricao: string,
    public readonly criadoPorId: string,
    public readonly responsavelId: string,
    public readonly produtoId: string,
    public readonly contexto?: string,
    public readonly publicoAfetado: string[] = [],
    public readonly volumeImpactado?: string,
    public readonly severidade?: string,
    public readonly comoIdentificado: string[] = [],
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Discovery } from '../../../domain/discovery/entities';
import { IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { DiscoveryCriadoEvent } from '../../../domain/discovery/events';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import { ProductId } from '../../../domain/shared/value-objects/product-id.vo';
import { DemandaId } from '../../../domain/demandas/value-objects';
import { StatusDiscoveryVO, SeveridadeProblemaVO } from '../../../domain/discovery/value-objects';
import { Inject, Logger } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';

@CommandHandler(CriarDiscoveryCommand)
export class CriarDiscoveryHandler implements ICommandHandler<CriarDiscoveryCommand> {
  private readonly logger = new Logger(CriarDiscoveryHandler.name);

  constructor(
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: CriarDiscoveryCommand): Promise<string> {
    const {
      tenantId,
      demandaId,
      titulo,
      descricao,
      contexto,
      publicoAfetado,
      volumeImpactado,
      severidade,
      comoIdentificado,
      criadoPorId,
      responsavelId,
      produtoId,
    } = command;

    // Check if discovery already exists for this demand
    const existingDiscovery = await this.discoveryRepository.findByDemandaId(
      new TenantId(tenantId),
      demandaId,
    );

    if (existingDiscovery) {
      throw new Error('Já existe um discovery para esta demanda');
    }

    // Create discovery
    const statusDefaultItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: 'status_discovery',
      slug: 'em_pesquisa',
    });

    const severidadeSlug = (severidade ?? 'media').toLowerCase();
    const severidadeItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: 'severidade_problema',
      slug: severidadeSlug,
    });

    const statusVO = StatusDiscoveryVO.fromCatalogItem(statusDefaultItem);
    const severidadeVO = SeveridadeProblemaVO.fromCatalogItem(severidadeItem);

    const discovery = Discovery.create({
      tenantId: new TenantId(tenantId),
      demandaId: new DemandaId(demandaId),
      titulo,
      descricao,
      contexto,
      publicoAfetado,
      volumeImpactado,
      severidade: severidadeVO,
      comoIdentificado,
      status: statusVO,
      criadoPorId: new UserId(criadoPorId),
      responsavelId: new UserId(responsavelId),
      produtoId: new ProductId(produtoId),
    });

    // Save discovery
    const savedDiscovery = await this.discoveryRepository.save(discovery);
    const discoveryId = savedDiscovery.id?.getValue() ?? '';

    // Emit event
    const event = new DiscoveryCriadoEvent(
      discoveryId,
      demandaId,
      tenantId,
      titulo,
      responsavelId,
      produtoId,
    );

    this.eventBus.publish(event);

    this.logger.log(`Discovery criado com ID: ${discoveryId}`);

    return discoveryId;
  }
}
