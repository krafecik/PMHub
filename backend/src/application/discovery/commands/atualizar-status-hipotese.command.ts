import { ICommand } from '@nestjs/cqrs';

export class AtualizarStatusHipoteseCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly hipoteseId: string,
    public readonly novoStatus: string, // EM_TESTE, VALIDADA, REFUTADA, ARQUIVADA
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { IHipoteseRepository } from '../../../domain/discovery/repositories';
import { HipoteseValidadaEvent } from '../../../domain/discovery/events';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  HipoteseId,
  StatusHipoteseEnum,
  StatusHipoteseVO,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(AtualizarStatusHipoteseCommand)
export class AtualizarStatusHipoteseHandler
  implements ICommandHandler<AtualizarStatusHipoteseCommand>
{
  private readonly logger = new Logger(AtualizarStatusHipoteseHandler.name);

  constructor(
    @Inject('IHipoteseRepository')
    private readonly hipoteseRepository: IHipoteseRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: AtualizarStatusHipoteseCommand): Promise<void> {
    const { tenantId, hipoteseId, novoStatus } = command;

    // Get hipotese
    const hipotese = await this.hipoteseRepository.findById(
      new TenantId(tenantId),
      new HipoteseId(hipoteseId),
    );

    if (!hipotese) {
      throw new NotFoundException('Hipótese não encontrada');
    }

    const statusEnum = novoStatus as StatusHipoteseEnum;
    const statusItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_HIPOTESE,
      slug: StatusHipoteseVO.enumToSlug(statusEnum),
    });
    const statusVO = StatusHipoteseVO.fromCatalogItem(statusItem);

    // Update status based on new status
    switch (statusEnum) {
      case StatusHipoteseEnum.EM_TESTE:
        hipotese.iniciarTeste(statusVO);
        break;

      case StatusHipoteseEnum.VALIDADA:
        hipotese.validar(statusVO);

        // Emit event for validated hypothesis
        {
          const event = new HipoteseValidadaEvent(
            hipoteseId,
            hipotese.discoveryId.getValue(),
            tenantId,
            hipotese.titulo,
            hipotese.impactoEsperado.getSlug().toUpperCase(),
          );
          this.eventBus.publish(event);
        }
        break;

      case StatusHipoteseEnum.REFUTADA:
        hipotese.refutar(statusVO);
        break;

      case StatusHipoteseEnum.ARQUIVADA:
        hipotese.arquivar(statusVO);
        break;

      default:
        throw new Error(`Status inválido: ${novoStatus}`);
    }

    // Update hipotese
    await this.hipoteseRepository.update(hipotese);

    this.logger.log(`Status da hipótese ${hipoteseId} atualizado para: ${novoStatus}`);
  }
}
