import { IQuery } from '@nestjs/cqrs';

export class BuscarDemandaPorIdQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
  ) {}
}
