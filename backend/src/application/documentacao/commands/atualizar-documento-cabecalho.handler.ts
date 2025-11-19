import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AtualizarDocumentoCabecalhoCommand } from './atualizar-documento-cabecalho.command';
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  DocumentoRepository,
  DocumentoStatusVO,
  DocumentoTipoVO,
} from '@domain/documentacao';
import { Inject, NotFoundException } from '@nestjs/common';

@CommandHandler(AtualizarDocumentoCabecalhoCommand)
export class AtualizarDocumentoCabecalhoHandler
  implements ICommandHandler<AtualizarDocumentoCabecalhoCommand, void>
{
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(command: AtualizarDocumentoCabecalhoCommand): Promise<void> {
    const { tenantId, documentoId, atualizadoPorId, ...resto } = command.payload;

    const documento = await this.repository.encontrarPorId(tenantId, documentoId);

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    documento.atualizarCabecalho({
      titulo: resto.titulo,
      resumo: resto.resumo,
      produtoId: resto.produtoId,
      pmId: resto.pmId,
      squadId: resto.squadId,
      atualizadoPorId,
      tipo: resto.tipo ? new DocumentoTipoVO(resto.tipo) : undefined,
      status: resto.status ? new DocumentoStatusVO(resto.status) : undefined,
    });

    await this.repository.salvar(documento);
  }
}
