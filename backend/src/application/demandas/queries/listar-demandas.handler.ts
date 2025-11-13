import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarDemandasQuery } from './listar-demandas.query';
import { Demanda } from '@domain/demandas';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
  DemandaPaginatedResult,
} from '@infra/repositories/demandas/demanda.repository.interface';

export interface DemandaListItem {
  id: string;
  titulo: string;
  tipo: string;
  tipoLabel: string;
  produtoId: string;
  origem: string;
  origemLabel: string;
  prioridade: string;
  prioridadeLabel: string;
  prioridadeColor: string;
  status: string;
  statusLabel: string;
  responsavelId?: string;
  criadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListarDemandasResult {
  data: DemandaListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@QueryHandler(ListarDemandasQuery)
export class ListarDemandasHandler implements IQueryHandler<ListarDemandasQuery> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
  ) {}

  async execute(query: ListarDemandasQuery): Promise<ListarDemandasResult> {
    const result = await this.demandaRepository.findAll(
      query.tenantId,
      query.filters,
    );

    return {
      data: result.data.map((demanda: Demanda) => ({
        id: demanda.id!,
        titulo: demanda.titulo.getValue(),
        tipo: demanda.tipo.getValue(),
        tipoLabel: demanda.tipo.getLabel(),
        produtoId: demanda.produtoId,
        origem: demanda.origem.getValue(),
        origemLabel: demanda.origem.getLabel(),
        prioridade: demanda.prioridade.getValue(),
        prioridadeLabel: demanda.prioridade.getLabel(),
        prioridadeColor: demanda.prioridade.getColor(),
        status: demanda.status.getValue(),
        statusLabel: demanda.status.getLabel(),
        responsavelId: demanda.responsavelId,
        criadoPorId: demanda.criadoPorId,
        createdAt: demanda.createdAt!,
        updatedAt: demanda.updatedAt!,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }
}
