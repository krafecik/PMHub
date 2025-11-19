import { ICommand, ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';

export class DeletarRegraCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
  ) {}
}

@CommandHandler(DeletarRegraCommand)
export class DeletarRegraHandler implements ICommandHandler<DeletarRegraCommand> {
  constructor(
    @Inject('RegraAutomacaoRepository')
    private readonly regraRepository: IRegraAutomacaoRepository,
  ) {}

  async execute(command: DeletarRegraCommand): Promise<void> {
    const regra = await this.regraRepository.findById(command.tenantId, command.id);

    if (!regra) {
      throw new Error('Regra não encontrada');
    }

    await this.regraRepository.delete(command.tenantId, command.id);
  }
}
