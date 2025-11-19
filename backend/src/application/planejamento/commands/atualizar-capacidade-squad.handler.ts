import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CapacitySnapshot, QuarterVO } from '@domain/planejamento';
import {
  IPlanejamentoCapacityRepository,
  PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { AtualizarCapacidadeSquadCommand } from './atualizar-capacidade-squad.command';

@CommandHandler(AtualizarCapacidadeSquadCommand)
@Injectable()
export class AtualizarCapacidadeSquadHandler
  implements ICommandHandler<AtualizarCapacidadeSquadCommand>
{
  constructor(
    @Inject(PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN)
    private readonly capacityRepository: IPlanejamentoCapacityRepository,
  ) {}

  async execute(command: AtualizarCapacidadeSquadCommand): Promise<void> {
    const {
      tenantId,
      squadId,
      quarter,
      capacidadeTotal,
      capacidadeUsada,
      bufferPercentual,
      ajustes,
    } = command;

    const existing = await this.capacityRepository.findBySquadAndQuarter(
      tenantId,
      squadId,
      quarter,
    );

    if (!existing) {
      const snapshot = CapacitySnapshot.create({
        tenantId,
        squadId,
        quarter: QuarterVO.create(quarter),
        capacidadeTotal,
        capacidadeUsada,
        bufferPercentual,
        ajustesJson: ajustes,
      });
      await this.capacityRepository.save(snapshot);
      return;
    }

    existing.atualizarCapacidade(capacidadeTotal, capacidadeUsada);
    existing.atualizarBuffer(bufferPercentual);
    if (ajustes) {
      existing.aplicarAjustes(ajustes);
    }

    await this.capacityRepository.save(existing);
  }
}
