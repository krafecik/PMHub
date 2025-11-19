import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ObterDocumentoQuery } from './obter-documento.query';
import { DOCUMENTO_REPOSITORY_TOKEN, Documento, DocumentoRepository } from '@domain/documentacao';
import { Inject, NotFoundException } from '@nestjs/common';

@QueryHandler(ObterDocumentoQuery)
export class ObterDocumentoHandler implements IQueryHandler<ObterDocumentoQuery, Documento> {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(query: ObterDocumentoQuery): Promise<Documento> {
    const documento = await this.repository.encontrarPorId(query.tenantId, query.documentoId);

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    return documento;
  }
}
