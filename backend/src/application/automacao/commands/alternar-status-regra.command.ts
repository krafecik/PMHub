import { ICommand, ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';

export class AlternarStatusRegraCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
    public readonly ativo: boolean,
  ) {}
}

@CommandHandler(AlternarStatusRegraCommand)
export class AlternarStatusRegraHandler implements ICommandHandler<AlternarStatusRegraCommand> {
  constructor(
    @Inject('RegraAutomacaoRepository')
    private readonly regraRepository: IRegraAutomacaoRepository,
  ) {}

  async execute(command: AlternarStatusRegraCommand): Promise<void> {
    const regra = await this.regraRepository.findById(command.tenantId, command.id);

    if (!regra) {
      throw new Error('Regra não encontrada');
    }

    if (command.ativo) {
      regra.ativar();
    } else {
      regra.desativar();
    }

    await this.regraRepository.save(regra);
  }
}
