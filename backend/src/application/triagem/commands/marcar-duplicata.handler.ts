import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { MarcarDuplicataCommand } from './marcar-duplicata.command';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import {
  DuplicatasRepository,
  DUPLICATAS_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/duplicatas.repository.interface';
import { StatusTriagemEnum, DuplicatasDemanda, DuplicataDetectadaEvent } from '@domain/triagem';

@CommandHandler(MarcarDuplicataCommand)
export class MarcarDuplicataHandler implements ICommandHandler<MarcarDuplicataCommand> {
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(DUPLICATAS_REPOSITORY_TOKEN)
    private readonly duplicatasRepository: DuplicatasRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarcarDuplicataCommand): Promise<void> {
    const { tenantId, demandaId, demandaOriginalId, marcadoPorId, similaridade = 100 } = command;

    if (demandaId === demandaOriginalId) {
      throw new Error('Uma demanda não pode ser duplicata de si mesma');
    }

    const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
    if (!triagem) {
      throw new Error(`Triagem não encontrada para a demanda ${demandaId}`);
    }

    const triagemOriginal = await this.triagemRepository.findByDemandaId(
      demandaOriginalId,
      tenantId,
    );
    if (!triagemOriginal) {
      throw new Error(`Triagem não encontrada para a demanda original ${demandaOriginalId}`);
    }

    const duplicataExistente = await this.duplicatasRepository.findByDemandaAndOriginal(
      triagem.id,
      triagemOriginal.id,
    );
    if (duplicataExistente) {
      throw new Error('Esta duplicata já foi registrada');
    }

    const duplicata = DuplicatasDemanda.criar(triagem.id, triagemOriginal.id, similaridade);
    await this.duplicatasRepository.create(duplicata);

    triagem.atualizarStatus(StatusTriagemEnum.DUPLICADO, marcadoPorId);
    await this.triagemRepository.update(triagem);

    const evento = new DuplicataDetectadaEvent({
      demandaId,
      demandaOriginalId,
      similaridade,
      marcadoPorId,
      timestamp: new Date(),
    });

    this.eventBus.publish(evento);
  }
}
