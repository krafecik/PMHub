import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoCapacityRepository,
  PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarCapacidadeQuery } from './listar-capacidade.query';

@QueryHandler(ListarCapacidadeQuery)
@Injectable()
export class ListarCapacidadeHandler implements IQueryHandler<ListarCapacidadeQuery> {
  constructor(
    @Inject(PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN)
    private readonly capacityRepository: IPlanejamentoCapacityRepository,
  ) {}

  async execute(query: ListarCapacidadeQuery) {
    const { tenantId, quarter } = query;
    const snapshots = await this.capacityRepository.listByQuarter(tenantId, quarter);
    return snapshots.map((snapshot) => {
      const obj = snapshot.toObject();
      return {
        ...obj,
        quarter: obj.quarter.getValue(),
      };
    });
  }
}
