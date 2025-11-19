import { IQuery } from '@nestjs/cqrs';

export class ObterDocumentoQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly documentoId: string,
  ) {}
}
