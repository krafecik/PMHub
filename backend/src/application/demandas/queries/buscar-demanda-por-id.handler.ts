import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { BuscarDemandaPorIdQuery } from './buscar-demanda-por-id.query';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';

export interface DemandaDetalhada {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  tipoLabel: string;
  produtoId: string;
  origem: string;
  origemLabel: string;
  origemDetalhe?: string;
  responsavelId?: string;
  prioridade: string;
  prioridadeLabel: string;
  prioridadeColor: string;
  status: string;
  statusLabel: string;
  criadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(BuscarDemandaPorIdQuery)
export class BuscarDemandaPorIdHandler implements IQueryHandler<BuscarDemandaPorIdQuery> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
  ) {}

  async execute(query: BuscarDemandaPorIdQuery): Promise<DemandaDetalhada> {
    const demanda = await this.demandaRepository.findById(
      query.tenantId,
      query.demandaId,
    );

    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    return {
      id: demanda.id!,
      titulo: demanda.titulo.getValue(),
      descricao: demanda.descricao,
      tipo: demanda.tipo.getValue(),
      tipoLabel: demanda.tipo.getLabel(),
      produtoId: demanda.produtoId,
      origem: demanda.origem.getValue(),
      origemLabel: demanda.origem.getLabel(),
      origemDetalhe: demanda.origemDetalhe,
      responsavelId: demanda.responsavelId,
      prioridade: demanda.prioridade.getValue(),
      prioridadeLabel: demanda.prioridade.getLabel(),
      prioridadeColor: demanda.prioridade.getColor(),
      status: demanda.status.getValue(),
      statusLabel: demanda.status.getLabel(),
      criadoPorId: demanda.criadoPorId,
      createdAt: demanda.createdAt!,
      updatedAt: demanda.updatedAt!,
    };
  }
}
