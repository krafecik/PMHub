import { IQuery } from '@nestjs/cqrs';

export class ListarDiscoveriesQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filters?: {
      status?: string[];
      responsavelId?: string;
      produtoId?: string;
      criadoPorId?: string;
      searchTerm?: string;
    },
    public readonly pagination?: {
      page?: number;
      pageSize?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'titulo';
      sortOrder?: 'asc' | 'desc';
    },
  ) {}
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IDiscoveryRepository,
  DiscoveryFilters,
  DiscoveryPaginationOptions,
  IHipoteseRepository,
  IPesquisaRepository,
  IInsightRepository,
  IExperimentoRepository,
} from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { DiscoveryId, StatusDiscoveryEnum } from '../../../domain/discovery/value-objects';
import { Inject, Logger } from '@nestjs/common';

export interface DiscoveryListItemDTO {
  id: string;
  demandaId: string;
  titulo: string;
  descricao: string;
  status: string;
  statusLabel: string;
  produtoId: string;
  produtoNome?: string;
  responsavelId: string;
  responsavelNome?: string;
  qtdHipoteses: number;
  qtdPesquisas: number;
  qtdInsights: number;
  qtdExperimentos: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedDiscoveriesDTO {
  items: DiscoveryListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@QueryHandler(ListarDiscoveriesQuery)
export class ListarDiscoveriesHandler implements IQueryHandler<ListarDiscoveriesQuery> {
  private readonly logger = new Logger(ListarDiscoveriesHandler.name);

  constructor(
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    @Inject('IHipoteseRepository')
    private readonly hipoteseRepository: IHipoteseRepository,
    @Inject('IPesquisaRepository')
    private readonly pesquisaRepository: IPesquisaRepository,
    @Inject('IInsightRepository')
    private readonly insightRepository: IInsightRepository,
    @Inject('IExperimentoRepository')
    private readonly experimentoRepository: IExperimentoRepository,
  ) {}

  async execute(query: ListarDiscoveriesQuery): Promise<PaginatedDiscoveriesDTO> {
    const { tenantId, filters, pagination } = query;
    const tenant = new TenantId(tenantId);

    // Map filters
    const discoveryFilters: DiscoveryFilters = {
      status: filters?.status as StatusDiscoveryEnum[] | undefined,
      responsavelId: filters?.responsavelId,
      produtoId: filters?.produtoId,
      criadoPorId: filters?.criadoPorId,
      searchTerm: filters?.searchTerm,
    };

    // Map pagination
    const paginationOptions: DiscoveryPaginationOptions = {
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20,
      sortBy: pagination?.sortBy || 'createdAt',
      sortOrder: pagination?.sortOrder || 'desc',
    };

    // Get discoveries
    const result = await this.discoveryRepository.findAll(
      tenant,
      discoveryFilters,
      paginationOptions,
    );

    // Transform to DTOs
    const items: DiscoveryListItemDTO[] = await Promise.all(
      result.items.map(async (discovery) => {
        const discoveryIdValue = discovery.id?.getValue();
        let qtdHipoteses = 0;
        let qtdPesquisas = 0;
        let qtdInsights = 0;
        let qtdExperimentos = 0;

        if (discoveryIdValue) {
          const discoveryIdVO = new DiscoveryId(discoveryIdValue);
          const counts = await Promise.all([
            this.hipoteseRepository.countByDiscovery(tenant, discoveryIdVO),
            this.pesquisaRepository.countByDiscovery(tenant, discoveryIdVO),
            this.insightRepository.countByDiscovery(tenant, discoveryIdVO),
            this.experimentoRepository.countByDiscovery(tenant, discoveryIdVO),
          ]);

          [qtdHipoteses, qtdPesquisas, qtdInsights, qtdExperimentos] = counts;
        }

        return {
          id: discoveryIdValue || '',
          demandaId: discovery.demandaId.getValue(),
          titulo: discovery.titulo,
          descricao: discovery.descricao,
          status: discovery.status.getValue(),
          statusLabel: discovery.status.getLabel(),
          produtoId: discovery.produtoId.getValue(),
          produtoNome: discovery.produtoNome,
          responsavelId: discovery.responsavelId.getValue(),
          responsavelNome: discovery.responsavelNome,
          qtdHipoteses,
          qtdPesquisas,
          qtdInsights,
          qtdExperimentos,
          tags: discovery.publicoAfetado || [],
          createdAt: discovery.createdAt || new Date(),
          updatedAt: discovery.updatedAt || new Date(),
        };
      }),
    );

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }
}
