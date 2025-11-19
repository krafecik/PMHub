import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListarDocumentosQuery } from './listar-documentos.query';
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  DocumentoRepository,
  ListarDocumentosResultado,
} from '@domain/documentacao';
import { Inject } from '@nestjs/common';

@QueryHandler(ListarDocumentosQuery)
export class ListarDocumentosHandler
  implements IQueryHandler<ListarDocumentosQuery, ListarDocumentosResultado>
{
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(query: ListarDocumentosQuery): Promise<ListarDocumentosResultado> {
    return this.repository.listar(query.params);
  }
}
