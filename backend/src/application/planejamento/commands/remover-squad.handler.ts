import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoSquadRepository,
  PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { RemoverSquadCommand } from './remover-squad.command';

@CommandHandler(RemoverSquadCommand)
@Injectable()
export class RemoverSquadHandler implements ICommandHandler<RemoverSquadCommand> {
  constructor(
    @Inject(PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN)
    private readonly squadRepository: IPlanejamentoSquadRepository,
  ) {}

  async execute(command: RemoverSquadCommand): Promise<void> {
    const { tenantId, squadId } = command;
    const squad = await this.squadRepository.findById(squadId, tenantId);
    if (!squad) {
      throw new NotFoundException('Squad não encontrado');
    }
    await this.squadRepository.delete(squadId, tenantId);
  }
}
