import { IQuery } from '@nestjs/cqrs';
import { DemandaFilters } from '@infra/repositories/demandas/demanda.repository.interface';

export class ListarDemandasQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filters?: DemandaFilters,
  ) {}
}
