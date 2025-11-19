import { ICommand } from '@nestjs/cqrs';

export class FinalizarDiscoveryCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly statusFinal: string, // APROVADO, REJEITADO, RETOMAR_DEPOIS, CRIAR_EPICO
    public readonly resumo: string,
    public readonly decididoPorId: string,
    public readonly aprendizados: string[] = [],
    public readonly recomendacoes: string[] = [],
    public readonly proximosPassos: string[] = [],
    public readonly materiaisAnexos?: Record<string, unknown>,
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import {
  IDiscoveryRepository,
  IDecisaoDiscoveryRepository,
} from '../../../domain/discovery/repositories';
import { DiscoveryFinalizadoEvent } from '../../../domain/discovery/events';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { DiscoveryId } from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { StatusDiscoveryVO } from '../../../domain/discovery/value-objects';
import { DecisaoDiscovery } from '../../../domain/discovery/entities';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';

@CommandHandler(FinalizarDiscoveryCommand)
export class FinalizarDiscoveryHandler implements ICommandHandler<FinalizarDiscoveryCommand> {
  private readonly logger = new Logger(FinalizarDiscoveryHandler.name);

  constructor(
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    @Inject('IDecisaoDiscoveryRepository')
    private readonly decisaoRepository: IDecisaoDiscoveryRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: FinalizarDiscoveryCommand): Promise<void> {
    const { tenantId, discoveryId, statusFinal, resumo, decididoPorId } = {
      tenantId: command.tenantId,
      discoveryId: command.discoveryId,
      statusFinal: command.statusFinal,
      resumo: command.resumo,
      decididoPorId: command.decididoPorId,
    };
    const aprendizados = command.aprendizados;
    const recomendacoes = command.recomendacoes;
    const proximosPassos = command.proximosPassos;
    const materiaisAnexos = command.materiaisAnexos;

    // Validate that discovery exists
    const discovery = await this.discoveryRepository.findById(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    if (!discovery) {
      throw new NotFoundException('Discovery não encontrado');
    }

    if (discovery.isFinal()) {
      throw new Error('Discovery já está finalizado');
    }

    // Determine the final status based on statusFinal param
    const statusSlug = statusFinal === 'CANCELADO' ? 'cancelado' : 'fechado';
    const statusItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: 'status_discovery',
      slug: statusSlug,
    });
    const finalStatus = StatusDiscoveryVO.fromCatalogItem(statusItem);

    // Finalize discovery
    discovery.finalizarComDecisao(finalStatus);

    // Update discovery
    await this.discoveryRepository.update(discovery);

    // Persist decision record
    const decisao = DecisaoDiscovery.create({
      tenantId: new TenantId(tenantId),
      discoveryId: new DiscoveryId(discoveryId),
      statusFinal: statusItem,
      resumo,
      aprendizados,
      recomendacoes,
      proximosPassos,
      materiaisAnexos: materiaisAnexos ?? null,
      decididoPorId: new UserId(decididoPorId),
    });

    await this.decisaoRepository.upsert(decisao);

    // Emit event
    const event = new DiscoveryFinalizadoEvent(
      discoveryId,
      tenantId,
      finalStatus.getValue(),
      resumo,
      aprendizados,
      recomendacoes,
    );

    this.eventBus.publish(event);

    this.logger.log(`Discovery finalizado com ID: ${discoveryId} - Status: ${statusFinal}`);
  }
}
