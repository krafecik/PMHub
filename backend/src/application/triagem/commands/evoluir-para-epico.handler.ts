import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { EvoluirParaEpicoCommand } from './evoluir-para-epico.command';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import { StatusTriagemEnum } from '@domain/triagem';

@CommandHandler(EvoluirParaEpicoCommand)
export class EvoluirParaEpicoHandler implements ICommandHandler<EvoluirParaEpicoCommand> {
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EvoluirParaEpicoCommand): Promise<void> {
    const { tenantId, demandaId, nomeEpico, objetivoEpico, produtoId, evoluidoPorId } = command;

    // Buscar triagem da demanda
    const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
    if (!triagem) {
      throw new Error(`Triagem não encontrada para a demanda ${demandaId}`);
    }

    // Verificar se pode evoluir para épico (deve ter alta complexidade/impacto)
    if (!triagem.impacto?.isHighPriority() && !triagem.complexidadeEstimada?.isAlta()) {
      throw new Error('Demanda não tem complexidade ou impacto suficiente para evoluir para épico');
    }

    // Atualizar status da triagem
    triagem.atualizarStatus(StatusTriagemEnum.EVOLUIU_EPICO, evoluidoPorId);
    await this.triagemRepository.update(triagem);

    // TODO: Quando o módulo de Roadmap/Épicos estiver implementado,
    // aqui seria criado o épico e vinculado à demanda

    // Por enquanto, apenas emitimos o evento que pode ser usado futuramente
    this.eventBus.publish({
      demandaId,
      nomeEpico,
      objetivoEpico,
      produtoId,
      evoluidoPorId,
      timestamp: new Date(),
    });
  }
}
