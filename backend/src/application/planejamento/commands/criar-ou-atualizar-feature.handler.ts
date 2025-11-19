import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Feature, FeatureStatus, FeatureStatusVO } from '@domain/planejamento';
import {
  IPlanejamentoFeatureRepository,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { CriarOuAtualizarFeatureCommand } from './criar-ou-atualizar-feature.command';

@CommandHandler(CriarOuAtualizarFeatureCommand)
@Injectable()
export class CriarOuAtualizarFeatureHandler
  implements ICommandHandler<CriarOuAtualizarFeatureCommand>
{
  constructor(
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
  ) {}

  async execute(command: CriarOuAtualizarFeatureCommand): Promise<{ featureId: string }> {
    const { tenantId, payload } = command;

    let feature: Feature | null = null;

    if (payload.featureId) {
      feature = await this.featureRepository.findById(payload.featureId, tenantId);
    }

    if (!feature) {
      feature = Feature.create({
        tenantId,
        epicoId: payload.epicoId,
        titulo: payload.titulo,
        descricao: payload.descricao,
        squadId: payload.squadId,
        pontos: payload.pontos,
        status: payload.status
          ? FeatureStatusVO.fromEnum(payload.status as FeatureStatus)
          : undefined,
        riscos: payload.riscos,
        criteriosAceite: payload.criteriosAceite,
        dependenciasIds: payload.dependenciasIds,
        revisadoPorId: payload.revisadoPorId,
      });
    } else {
      feature.atualizarDetalhes({
        descricao: payload.descricao,
        pontos: payload.pontos,
        riscos: payload.riscos,
        criteriosAceite: payload.criteriosAceite,
      });
      if (payload.status) {
        feature.atualizarStatus(FeatureStatusVO.fromEnum(payload.status as FeatureStatus));
      }
      feature.atribuirSquad(payload.squadId);
      if (payload.dependenciasIds) {
        feature.definirDependencias(payload.dependenciasIds);
      }
      if (payload.revisadoPorId) {
        feature.revisarEstimativa(payload.revisadoPorId);
      }
    }

    const featureId = await this.featureRepository.save(feature);

    return { featureId };
  }
}
