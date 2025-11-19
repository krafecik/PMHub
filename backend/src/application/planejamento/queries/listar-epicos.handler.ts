import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoEpicoRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarEpicosQuery } from './listar-epicos.query';

@QueryHandler(ListarEpicosQuery)
@Injectable()
export class ListarEpicosHandler implements IQueryHandler<ListarEpicosQuery> {
  constructor(
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
  ) {}

  async execute(query: ListarEpicosQuery) {
    const { tenantId, filtros } = query;
    const result = await this.epicoRepository.list({
      tenantId,
      ...filtros,
    });

    return {
      total: result.total,
      data: result.data.map((epico) => {
        const obj = epico.toObject();
        return {
          ...obj,
          status: obj.status.getValue(),
          health: obj.health.getValue(),
          quarter: obj.quarter.getValue(),
        };
      }),
    };
  }
}
