import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AtualizarDocumentoSecoesCommand } from './atualizar-documento-secoes.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { DOCUMENTO_REPOSITORY_TOKEN, DocumentoRepository } from '@domain/documentacao';

@CommandHandler(AtualizarDocumentoSecoesCommand)
export class AtualizarDocumentoSecoesHandler
  implements ICommandHandler<AtualizarDocumentoSecoesCommand, void>
{
  constructor(
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repository: DocumentoRepository,
  ) {}

  async execute(command: AtualizarDocumentoSecoesCommand): Promise<void> {
    const {
      tenantId,
      documentoId,
      objetivo,
      contexto,
      requisitosFuncionais,
      regrasNegocio,
      requisitosNaoFuncionais,
      fluxos,
      criteriosAceite,
      riscos,
    } = command.payload;

    const documento = await this.repository.encontrarPorId(tenantId, documentoId);

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (objetivo !== undefined) {
      documento.atualizarObjetivo(objetivo);
    }

    if (contexto !== undefined) {
      documento.atualizarContexto(contexto);
    }

    if (requisitosFuncionais !== undefined) {
      documento.atualizarRequisitosFuncionais(requisitosFuncionais);
    }

    if (regrasNegocio !== undefined) {
      documento.atualizarRegrasNegocio(regrasNegocio);
    }

    if (requisitosNaoFuncionais !== undefined) {
      documento.atualizarRequisitosNaoFuncionais(requisitosNaoFuncionais);
    }

    if (fluxos !== undefined) {
      documento.atualizarFluxos(fluxos);
    }

    if (criteriosAceite !== undefined) {
      documento.atualizarCriteriosAceite(criteriosAceite);
    }

    if (riscos !== undefined) {
      documento.atualizarRiscos(riscos);
    }

    await this.repository.salvar(documento);
  }
}
