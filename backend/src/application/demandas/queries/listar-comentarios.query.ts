import { IQuery } from '@nestjs/cqrs';

export class ListarComentariosQuery implements IQuery {
  constructor(
    public readonly demandaId: string,
  ) {}
}
