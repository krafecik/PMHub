import { IQuery } from '@nestjs/cqrs';

export class ListarAnexosQuery implements IQuery {
  constructor(
    public readonly demandaId: string,
  ) {}
}
