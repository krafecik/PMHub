import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SolicitarInformacaoCommand } from './solicitar-informacao.command';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import {
  SolicitacaoInfoRepository,
  SOLICITACAO_INFO_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/solicitacao-info.repository.interface';
import { StatusTriagemEnum, SolicitacaoInfo, InformacaoSolicitadaEvent } from '@domain/triagem';

@CommandHandler(SolicitarInformacaoCommand)
export class SolicitarInformacaoHandler implements ICommandHandler<SolicitarInformacaoCommand> {
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(SOLICITACAO_INFO_REPOSITORY_TOKEN)
    private readonly solicitacaoRepository: SolicitacaoInfoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SolicitarInformacaoCommand): Promise<string> {
    const { tenantId, demandaId, solicitanteId, solicitadoPorId, texto, prazo } = command;

    // Buscar triagem da demanda
    const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
    if (!triagem) {
      throw new Error(`Triagem não encontrada para a demanda ${demandaId}`);
    }

    // Verificar se pode solicitar informações no status atual
    if (
      ![StatusTriagemEnum.PENDENTE_TRIAGEM, StatusTriagemEnum.RETOMADO_TRIAGEM].includes(
        triagem.statusTriagem.value as StatusTriagemEnum,
      )
    ) {
      throw new Error(
        `Não é possível solicitar informações no status atual: ${triagem.statusTriagem.value}`,
      );
    }

    // Criar solicitação
    const solicitacao = SolicitacaoInfo.criar(triagem.id, solicitanteId, texto, prazo);

    // Salvar solicitação
    const solicitacaoSalva = await this.solicitacaoRepository.create(solicitacao);

    // Atualizar status da triagem
    triagem.atualizarStatus(StatusTriagemEnum.AGUARDANDO_INFO, solicitadoPorId);
    await this.triagemRepository.update(triagem);

    // Emitir evento
    const evento = new InformacaoSolicitadaEvent({
      tenantId,
      demandaId,
      triagemId: triagem.id,
      solicitacaoId: solicitacaoSalva.id,
      solicitanteId,
      texto,
      prazo,
      timestamp: new Date(),
    });

    this.eventBus.publish(evento);

    return solicitacaoSalva.id;
  }
}
