import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoCenarioRepository,
  PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarCenariosQuery } from './listar-cenarios.query';

@QueryHandler(ListarCenariosQuery)
@Injectable()
export class ListarCenariosHandler implements IQueryHandler<ListarCenariosQuery> {
  constructor(
    @Inject(PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN)
    private readonly cenarioRepository: IPlanejamentoCenarioRepository,
  ) {}

  async execute(query: ListarCenariosQuery) {
    const { tenantId, quarter } = query;
    const cenarios = await this.cenarioRepository.listByQuarter(tenantId, quarter);
    return cenarios.map((cenario) => {
      const obj = cenario.toObject();
      return {
        ...obj,
        quarter: obj.quarter.getValue(),
        status: obj.status.getValue(),
        statusSlug: obj.status.slug,
        statusLabel: obj.status.label,
        statusMetadata: obj.status.metadata,
        statusId: obj.status.id,
      };
    });
  }
}
