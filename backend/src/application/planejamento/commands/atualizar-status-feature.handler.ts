import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FeatureStatus, FeatureStatusVO } from '@domain/planejamento';
import {
  IPlanejamentoFeatureRepository,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { AtualizarStatusFeatureCommand } from './atualizar-status-feature.command';

@CommandHandler(AtualizarStatusFeatureCommand)
@Injectable()
export class AtualizarStatusFeatureHandler
  implements ICommandHandler<AtualizarStatusFeatureCommand>
{
  constructor(
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
  ) {}

  async execute(command: AtualizarStatusFeatureCommand): Promise<void> {
    const { featureId, tenantId, status } = command;
    const feature = await this.featureRepository.findById(featureId, tenantId);

    if (!feature) {
      throw new NotFoundException('Feature não encontrada');
    }

    feature.atualizarStatus(FeatureStatusVO.fromEnum(status as FeatureStatus));
    await this.featureRepository.save(feature);
  }
}
