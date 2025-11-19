import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListarVersoesDocumentoQuery } from './listar-versoes-documento.query';
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  DocumentoRepository,
  DocumentoVersao,
} from '@domain/documentacao';
import { Inject } from '@nestjs/common';

@QueryHandler(ListarVersoesDocumentoQuery)
export class ListarVersoesDocumentoHandler
  implements IQueryHandler<ListarVersoesDocumentoQuery, DocumentoVersao[]>
{
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(query: ListarVersoesDocumentoQuery): Promise<DocumentoVersao[]> {
    return this.repository.listarVersoes(query.documentoId, query.tenantId);
  }
}
