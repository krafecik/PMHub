import { IQuery } from '@nestjs/cqrs';

export interface ListarDocumentosQueryParams {
  tenantId: string;
  termo?: string;
  tipos?: string[];
  status?: string[];
  produtoId?: string;
  pmId?: string;
  squadId?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export class ListarDocumentosQuery implements IQuery {
  constructor(public readonly params: ListarDocumentosQueryParams) {}
}
