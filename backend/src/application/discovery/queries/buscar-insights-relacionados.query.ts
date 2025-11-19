import { IQuery } from '@nestjs/cqrs';

export class BuscarInsightsRelacionadosQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly tags: string[],
    public readonly excludeDiscoveryId?: string,
    public readonly limit: number = 10,
  ) {}
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInsightRepository, IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { DiscoveryId } from '../../../domain/discovery/value-objects';
import { Inject, Logger } from '@nestjs/common';

export interface InsightRelacionadoDTO {
  id: string;
  discoveryId: string;
  discoveryTitulo?: string;
  descricao: string;
  impacto: string;
  impactoLabel: string;
  confianca: string;
  confiancaLabel: string;
  tags: string[];
  relevanceScore: number;
  createdAt: Date;
}

@QueryHandler(BuscarInsightsRelacionadosQuery)
export class BuscarInsightsRelacionadosHandler
  implements IQueryHandler<BuscarInsightsRelacionadosQuery>
{
  private readonly logger = new Logger(BuscarInsightsRelacionadosHandler.name);

  constructor(
    @Inject('IInsightRepository')
    private readonly insightRepository: IInsightRepository,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
  ) {}

  async execute(query: BuscarInsightsRelacionadosQuery): Promise<InsightRelacionadoDTO[]> {
    const { tenantId, tags, excludeDiscoveryId, limit } = query;

    if (!tags || tags.length === 0) {
      return [];
    }

    // Find related insights by tags
    const insights = await this.insightRepository.findRelatedByTags(
      new TenantId(tenantId),
      tags,
      excludeDiscoveryId ? new DiscoveryId(excludeDiscoveryId) : undefined,
    );

    // Sort by relevance score and limit
    const sortedInsights = insights
      .sort((a, b) => b.getRelevanceScore() - a.getRelevanceScore())
      .slice(0, limit);

    const discoveryIds = Array.from(
      new Set(sortedInsights.map((insight) => insight.discoveryId.getValue())),
    );

    const discoveryRecords = await Promise.all(
      discoveryIds.map((id) =>
        this.discoveryRepository.findById(new TenantId(tenantId), new DiscoveryId(id)),
      ),
    );

    const discoveryTitleMap = new Map<string, string>();
    discoveryRecords.forEach((record) => {
      if (record?.id) {
        discoveryTitleMap.set(record.id.getValue(), record.titulo);
      }
    });

    // Transform to DTOs
    const insightDTOs: InsightRelacionadoDTO[] = await Promise.all(
      sortedInsights.map(async (insight) => {
        const discoveryTitulo = discoveryTitleMap.get(insight.discoveryId.getValue());

        return {
          id: insight.id?.getValue() || '',
          discoveryId: insight.discoveryId.getValue(),
          discoveryTitulo,
          descricao: insight.descricao,
          impacto: insight.impacto.getValue(),
          impactoLabel: insight.impacto.getLabel(),
          confianca: insight.confianca.getValue(),
          confiancaLabel: insight.confianca.getLabel(),
          tags: insight.tags,
          relevanceScore: insight.getRelevanceScore(),
          createdAt: insight.createdAt || new Date(),
        };
      }),
    );

    this.logger.log(`Found ${insightDTOs.length} related insights for tags: ${tags.join(', ')}`);

    return insightDTOs;
  }
}
