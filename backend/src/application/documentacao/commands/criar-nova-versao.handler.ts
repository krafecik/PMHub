import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CriarNovaVersaoCommand } from './criar-nova-versao.command';
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  DocumentoRepository,
  DocumentoVersao,
  VersaoVO,
} from '@domain/documentacao';
import { Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

@CommandHandler(CriarNovaVersaoCommand)
export class CriarNovaVersaoHandler implements ICommandHandler<CriarNovaVersaoCommand, string> {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(command: CriarNovaVersaoCommand): Promise<string> {
    const {
      tenantId,
      documentoId,
      criadoPorId,
      versao,
      objetivo,
      contexto,
      requisitosFuncionais,
      regrasNegocio,
      requisitosNaoFuncionais,
      fluxos,
      criteriosAceite,
      riscos,
      changelogResumo,
    } = command.payload;

    const documento = await this.repository.encontrarPorId(tenantId, documentoId);

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    const novaVersaoId = randomUUID();

    const novaVersao = new DocumentoVersao({
      id: novaVersaoId,
      documentoId: documento.idValue,
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
      changelogResumo,
      createdBy: criadoPorId,
    });

    documento.adicionarVersao(novaVersao);

    await this.repository.salvar(documento);

    return novaVersaoId;
  }
}
