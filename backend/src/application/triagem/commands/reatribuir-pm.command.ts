import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';

export class ReatribuirPmCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly novoPmId: string,
    public readonly usuarioId: string,
  ) {}
}

@CommandHandler(ReatribuirPmCommand)
export class ReatribuirPmHandler implements ICommandHandler<ReatribuirPmCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
  ) {}

  async execute(command: ReatribuirPmCommand): Promise<void> {
    const { tenantId, demandaId, novoPmId } = command;

    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new Error('Demanda não encontrada para reatribuição');
    }

    if (demanda.responsavelId === novoPmId) {
      return;
    }

    demanda.atribuirResponsavel(novoPmId);
    await this.demandaRepository.update(demanda);

    // Atualizar a triagem (atualiza timestamps) se existir
    const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
    if (triagem) {
      await this.triagemRepository.update(triagem);
    }
  }
}
