import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoEpicoRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
  IPlanejamentoFeatureRepository,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ObterTimelineQuery } from './obter-timeline.query';

@QueryHandler(ObterTimelineQuery)
@Injectable()
export class ObterTimelineHandler implements IQueryHandler<ObterTimelineQuery> {
  constructor(
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
  ) {}

  async execute(query: ObterTimelineQuery) {
    const { tenantId, quarter } = query;
    const epicos = await this.epicoRepository.list({
      tenantId,
      quarter,
      page: 1,
      pageSize: 500,
    });

    const timeline: Record<
      string,
      {
        squadId: string | undefined;
        epicos: any[];
      }
    > = {};

    for (const epico of epicos.data) {
      const epicoObj = epico.toObject();
      const squadKey = epicoObj.squadId ?? 'unassigned';
      if (!timeline[squadKey]) {
        timeline[squadKey] = {
          squadId: epicoObj.squadId,
          epicos: [],
        };
      }
      const features = await this.featureRepository.listByEpico(epicoObj.id!, tenantId);
      timeline[squadKey].epicos.push({
        ...epicoObj,
        status: epicoObj.status.getValue(),
        health: epicoObj.health.getValue(),
        quarter: epicoObj.quarter.getValue(),
        features: features.map((feature) => {
          const featureObj = feature.toObject();
          return {
            ...featureObj,
            status: featureObj.status.getValue(),
          };
        }),
      });
    }

    return timeline;
  }
}
