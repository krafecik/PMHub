import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CompararVersoesDocumentoQuery } from './comparar-versoes-documento.query';
import { DOCUMENTO_REPOSITORY_TOKEN, DocumentoRepository } from '@domain/documentacao';
import { Inject, NotFoundException } from '@nestjs/common';

interface CompararVersoesResultado {
  versaoA: Record<string, any>;
  versaoB: Record<string, any>;
}

@QueryHandler(CompararVersoesDocumentoQuery)
export class CompararVersoesDocumentoHandler
  implements IQueryHandler<CompararVersoesDocumentoQuery, CompararVersoesResultado>
{
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(query: CompararVersoesDocumentoQuery): Promise<CompararVersoesResultado> {
    const versaoA = await this.repository.encontrarVersaoPorId(query.tenantId, query.versaoAId);
    const versaoB = await this.repository.encontrarVersaoPorId(query.tenantId, query.versaoBId);

    if (!versaoA || !versaoB) {
      throw new NotFoundException('Versão do documento não encontrada');
    }

    return {
      versaoA: versaoA.toJSON(),
      versaoB: versaoB.toJSON(),
    };
  }
}
