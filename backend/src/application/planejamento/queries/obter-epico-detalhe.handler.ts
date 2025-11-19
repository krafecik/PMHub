import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
  IPlanejamentoEpicoRepository,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
  IPlanejamentoFeatureRepository,
  PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
  IPlanejamentoDependenciaRepository,
} from '@infra/repositories/planejamento';
import { ObterEpicoDetalheQuery } from './obter-epico-detalhe.query';

@QueryHandler(ObterEpicoDetalheQuery)
@Injectable()
export class ObterEpicoDetalheHandler implements IQueryHandler<ObterEpicoDetalheQuery> {
  constructor(
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
    @Inject(PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN)
    private readonly dependenciaRepository: IPlanejamentoDependenciaRepository,
  ) {}

  async execute(query: ObterEpicoDetalheQuery) {
    const { tenantId, epicoId } = query;
    const epico = await this.epicoRepository.findById(epicoId, tenantId);

    if (!epico) {
      throw new NotFoundException('Épico não encontrado');
    }

    const features = await this.featureRepository.listByEpico(epicoId, tenantId);
    const dependencias = await Promise.all(
      features.map((feature) => this.dependenciaRepository.listByFeature(feature.id!, tenantId)),
    );

    const epicoObj = epico.toObject();

    return {
      epico: {
        ...epicoObj,
        status: epicoObj.status.getValue(),
        health: epicoObj.health.getValue(),
        quarter: epicoObj.quarter.getValue(),
      },
      features: features.map((feature, index) => {
        const featureObj = feature.toObject();
        return {
          ...featureObj,
          status: featureObj.status.getValue(),
          dependencias: (dependencias[index] ?? []).map((dep) => dep.toObject()),
        };
      }),
    };
  }
}
