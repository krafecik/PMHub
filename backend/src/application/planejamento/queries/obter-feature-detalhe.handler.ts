import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoFeatureRepository,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ObterFeatureDetalheQuery } from './obter-feature-detalhe.query';

@QueryHandler(ObterFeatureDetalheQuery)
@Injectable()
export class ObterFeatureDetalheHandler implements IQueryHandler<ObterFeatureDetalheQuery> {
  constructor(
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
  ) {}

  async execute(query: ObterFeatureDetalheQuery) {
    const { tenantId, featureId } = query;
    const feature = await this.featureRepository.findById(featureId, tenantId);

    if (!feature) {
      throw new NotFoundException('Feature não encontrada');
    }

    const obj = feature.toObject();
    return {
      ...obj,
      status: obj.status.getValue(),
    };
  }
}
