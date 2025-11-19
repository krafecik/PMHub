import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoFeatureRepository,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarFeaturesQuery } from './listar-features.query';

@QueryHandler(ListarFeaturesQuery)
@Injectable()
export class ListarFeaturesHandler implements IQueryHandler<ListarFeaturesQuery> {
  constructor(
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
  ) {}

  async execute(query: ListarFeaturesQuery) {
    const { tenantId, filtros } = query;
    const result = await this.featureRepository.list({
      tenantId,
      ...filtros,
    });

    return {
      total: result.total,
      data: result.data.map((feature) => {
        const obj = feature.toObject();
        return {
          ...obj,
          status: obj.status.getValue(),
        };
      }),
    };
  }
}
