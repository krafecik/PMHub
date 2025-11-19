import { IQuery } from '@nestjs/cqrs';

export class ListarVersoesDocumentoQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly documentoId: string,
  ) {}
}
