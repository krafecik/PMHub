import { IQuery } from '@nestjs/cqrs';

export class ObterEstatisticasDiscoveryQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly produtoId?: string,
    public readonly periodo?: {
      dataInicio: Date;
      dataFim: Date;
    },
  ) {}
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IDiscoveryRepository,
  IHipoteseRepository,
  IInsightRepository,
  IExperimentoRepository,
} from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { ProductId } from '../../../domain/shared/value-objects/product-id.vo';
import {
  StatusDiscoveryEnum,
  StatusHipoteseEnum,
  StatusInsightEnum,
  StatusExperimentoEnum,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger } from '@nestjs/common';

export interface EstatisticasDiscoveryDTO {
  totalDiscoveries: number;
  discoveriesEmPesquisa: number;
  discoveriesValidando: number;
  discoveriesFechados: number;
  discoveriesCancelados: number;

  totalHipoteses: number;
  hipotesesValidadas: number;
  hipotesesRefutadas: number;
  taxaValidacaoHipoteses: number;

  totalInsights: number;
  insightsValidados: number;
  insightsEmAnalise: number;

  totalExperimentos: number;
  experimentosConcluidos: number;
  experimentosComResultadosSignificativos: number;
  taxaSucessoExperimentos: number;

  tempoMedioDiscovery?: number; // em dias
  discoveriesTotaisPorProduto?: Record<string, number>;
  evolucaoMensal?: Array<{
    mes: string;
    total: number;
    fechados: number;
    cancelados: number;
  }>;
}

@QueryHandler(ObterEstatisticasDiscoveryQuery)
export class ObterEstatisticasDiscoveryHandler
  implements IQueryHandler<ObterEstatisticasDiscoveryQuery>
{
  private readonly logger = new Logger(ObterEstatisticasDiscoveryHandler.name);

  constructor(
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    @Inject('IHipoteseRepository')
    private readonly hipoteseRepository: IHipoteseRepository,
    @Inject('IInsightRepository')
    private readonly insightRepository: IInsightRepository,
    @Inject('IExperimentoRepository')
    private readonly experimentoRepository: IExperimentoRepository,
  ) {}

  async execute(query: ObterEstatisticasDiscoveryQuery): Promise<EstatisticasDiscoveryDTO> {
    const { tenantId, produtoId } = query;
    const tenant = new TenantId(tenantId);

    // Get discovery counts
    const [
      totalDiscoveries,
      discoveriesEmPesquisa,
      discoveriesValidando,
      discoveriesFechados,
      discoveriesCancelados,
    ] = await Promise.all([
      this.getDiscoveryCount(tenant, produtoId),
      this.discoveryRepository.countByStatus(tenant, StatusDiscoveryEnum.EM_PESQUISA),
      this.discoveryRepository.countByStatus(tenant, StatusDiscoveryEnum.VALIDANDO),
      this.discoveryRepository.countByStatus(tenant, StatusDiscoveryEnum.FECHADO),
      this.discoveryRepository.countByStatus(tenant, StatusDiscoveryEnum.CANCELADO),
    ]);

    // Get hipoteses stats
    const allHipoteses = await this.hipoteseRepository.findAll(tenant);
    const totalHipoteses = allHipoteses.length;
    const hipotesesValidadas = allHipoteses.filter(
      (h) => h.status.getValue() === StatusHipoteseEnum.VALIDADA,
    ).length;
    const hipotesesRefutadas = allHipoteses.filter(
      (h) => h.status.getValue() === StatusHipoteseEnum.REFUTADA,
    ).length;
    const taxaValidacaoHipoteses =
      totalHipoteses > 0 ? Math.round((hipotesesValidadas / totalHipoteses) * 100) : 0;

    // Get insights stats
    const allInsights = await this.insightRepository.findAll(tenant);
    const totalInsights = allInsights.length;
    const insightsValidados = allInsights.filter(
      (i) => i.status.getValue() === StatusInsightEnum.VALIDADO,
    ).length;
    const insightsEmAnalise = allInsights.filter(
      (i) => i.status.getValue() === StatusInsightEnum.EM_ANALISE,
    ).length;

    // Get experimentos stats
    const allExperimentos = await this.experimentoRepository.findAll(tenant);
    const totalExperimentos = allExperimentos.length;
    const experimentosConcluidos = allExperimentos.filter(
      (e) => e.status.getValue() === StatusExperimentoEnum.CONCLUIDO,
    ).length;
    const experimentosComResultadosSignificativos = allExperimentos.filter(
      (e) =>
        e.status.getValue() === StatusExperimentoEnum.CONCLUIDO && e.isStatisticallySignificant(),
    ).length;
    const taxaSucessoExperimentos =
      experimentosConcluidos > 0
        ? Math.round((experimentosComResultadosSignificativos / experimentosConcluidos) * 100)
        : 0;

    // Calculate average discovery time (in days)
    let tempoMedioDiscovery: number | undefined;
    if (discoveriesFechados + discoveriesCancelados > 0) {
      const finishedDiscoveries = await this.discoveryRepository.findAll(tenant, {
        status: [StatusDiscoveryEnum.FECHADO, StatusDiscoveryEnum.CANCELADO],
      });

      const durations = finishedDiscoveries.items
        .filter((d) => d.createdAt && d.updatedAt)
        .map((d) => {
          const start = d.createdAt!.getTime();
          const end = d.updatedAt!.getTime();
          return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
        });

      if (durations.length > 0) {
        tempoMedioDiscovery = Math.round(
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        );
      }
    }

    let discoveriesTotaisPorProduto: Record<string, number> = {};
    let evolucaoMensal:
      | Array<{
          mes: string;
          total: number;
          fechados: number;
          cancelados: number;
        }>
      | undefined;

    if (totalDiscoveries > 0) {
      const aggregated = await this.discoveryRepository.findAll(
        tenant,
        {},
        {
          page: 1,
          pageSize: totalDiscoveries,
          sortBy: 'createdAt',
          sortOrder: 'asc',
        },
      );

      discoveriesTotaisPorProduto = aggregated.items.reduce<Record<string, number>>(
        (acc, discovery) => {
          const key = discovery.produtoId.getValue();
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        },
        {},
      );

      const monthlyMap = new Map<
        string,
        {
          mes: string;
          total: number;
          fechados: number;
          cancelados: number;
        }
      >();

      aggregated.items.forEach((discovery) => {
        const createdAt = discovery.createdAt || new Date();
        const creationKey = this.formatMonth(createdAt);
        const creationEntry = monthlyMap.get(creationKey) ?? {
          mes: creationKey,
          total: 0,
          fechados: 0,
          cancelados: 0,
        };
        creationEntry.total += 1;
        monthlyMap.set(creationKey, creationEntry);

        if (discovery.status.getValue() === StatusDiscoveryEnum.FECHADO) {
          const finalKey = this.formatMonth(discovery.updatedAt || createdAt);
          const entry = monthlyMap.get(finalKey) ?? {
            mes: finalKey,
            total: 0,
            fechados: 0,
            cancelados: 0,
          };
          entry.fechados += 1;
          monthlyMap.set(finalKey, entry);
        }

        if (discovery.status.getValue() === StatusDiscoveryEnum.CANCELADO) {
          const cancelKey = this.formatMonth(discovery.updatedAt || createdAt);
          const entry = monthlyMap.get(cancelKey) ?? {
            mes: cancelKey,
            total: 0,
            fechados: 0,
            cancelados: 0,
          };
          entry.cancelados += 1;
          monthlyMap.set(cancelKey, entry);
        }
      });

      evolucaoMensal = Array.from(monthlyMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));
    }

    return {
      totalDiscoveries,
      discoveriesEmPesquisa,
      discoveriesValidando,
      discoveriesFechados,
      discoveriesCancelados,

      totalHipoteses,
      hipotesesValidadas,
      hipotesesRefutadas,
      taxaValidacaoHipoteses,

      totalInsights,
      insightsValidados,
      insightsEmAnalise,

      totalExperimentos,
      experimentosConcluidos,
      experimentosComResultadosSignificativos,
      taxaSucessoExperimentos,

      tempoMedioDiscovery,
      discoveriesTotaisPorProduto,
      evolucaoMensal,
    };
  }

  private async getDiscoveryCount(tenant: TenantId, produtoId?: string): Promise<number> {
    if (produtoId) {
      return this.discoveryRepository.countByProduto(tenant, new ProductId(produtoId));
    }

    // Get total count
    const result = await this.discoveryRepository.findAll(tenant, {}, { page: 1, pageSize: 1 });
    return result.total;
  }

  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
}
