import { ICommand } from '@nestjs/cqrs';

export class ConcluirExperimentoCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly experimentoId: string,
    public readonly resultados: unknown,
    public readonly pValue?: number,
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { IExperimentoRepository } from '../../../domain/discovery/repositories';
import { ExperimentoConcluidoEvent } from '../../../domain/discovery/events';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  ExperimentoId,
  StatusExperimentoVO,
  StatusExperimentoEnum,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(ConcluirExperimentoCommand)
export class ConcluirExperimentoHandler implements ICommandHandler<ConcluirExperimentoCommand> {
  private readonly logger = new Logger(ConcluirExperimentoHandler.name);

  constructor(
    @Inject('IExperimentoRepository')
    private readonly experimentoRepository: IExperimentoRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: ConcluirExperimentoCommand): Promise<void> {
    const { tenantId, experimentoId, resultados, pValue } = command;

    // Get experimento
    const experimento = await this.experimentoRepository.findById(
      new TenantId(tenantId),
      new ExperimentoId(experimentoId),
    );

    if (!experimento) {
      throw new NotFoundException('Experimento não encontrado');
    }

    // Register results
    experimento.registrarResultados(resultados, pValue);

    const statusConcluidoItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_EXPERIMENTO,
      slug: StatusExperimentoVO.enumToSlug(StatusExperimentoEnum.CONCLUIDO),
    });

    // Conclude experiment
    experimento.concluir(StatusExperimentoVO.fromCatalogItem(statusConcluidoItem));

    // Update experimento
    await this.experimentoRepository.update(experimento);

    // Determine result based on statistical significance
    const isSignificant = experimento.isStatisticallySignificant();
    const resultado = isSignificant ? 'sucesso' : 'inconclusivo';

    // Emit event
    const event = new ExperimentoConcluidoEvent(
      experimentoId,
      experimento.discoveryId.getValue(),
      tenantId,
      experimento.titulo,
      resultado,
      pValue,
    );

    this.eventBus.publish(event);

    this.logger.log(
      `Experimento ${experimentoId} concluído - p-value: ${pValue}, resultado: ${resultado}`,
    );
  }
}
