import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CriarDocumentoCommand } from './criar-documento.command';
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  Documento,
  DocumentoRepository,
  DocumentoStatusVO,
  DocumentoTipoVO,
  VersaoVO,
} from '@domain/documentacao';
import { Inject } from '@nestjs/common';

@CommandHandler(CriarDocumentoCommand)
export class CriarDocumentoHandler implements ICommandHandler<CriarDocumentoCommand, string> {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(command: CriarDocumentoCommand): Promise<string> {
    const {
      tenantId,
      tipo,
      titulo,
      resumo,
      status = 'RASCUNHO',
      produtoId,
      pmId,
      squadId,
      criadoPorId,
      versao = '1.0',
      objetivo,
      contexto,
      requisitosFuncionais,
      regrasNegocio,
      requisitosNaoFuncionais,
      fluxos,
      criteriosAceite,
      riscos,
    } = command.props;

    const documentoId = randomUUID();
    const documento = Documento.criar({
      tenantId,
      tipo: new DocumentoTipoVO(tipo),
      titulo,
      resumo,
      status: new DocumentoStatusVO(status),
      produtoId,
      pmId,
      squadId,
      criadoPorId,
      versaoInicial: {
        documentoId,
        tenantId,
        versao: new VersaoVO(versao),
        objetivo,
        contexto,
        requisitosFuncionais,
        regrasNegocio,
        requisitosNaoFuncionais,
        fluxos,
        criteriosAceite,
        riscos,
        createdBy: criadoPorId,
      },
    });

    await this.repository.criar(documento);

    return documento.idValue;
  }
}
