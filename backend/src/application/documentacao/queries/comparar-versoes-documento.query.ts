import { IQuery } from '@nestjs/cqrs';

export class CompararVersoesDocumentoQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly versaoAId: string,
    public readonly versaoBId: string,
  ) {}
}
