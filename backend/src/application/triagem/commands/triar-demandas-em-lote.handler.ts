import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TriarDemandasEmLoteCommand } from './triar-demandas-em-lote.command';
import { TriarDemandaCommand } from './triar-demanda.command';
import { CommandBus } from '@nestjs/cqrs';
import { StatusTriagemEnum } from '@domain/triagem';

export interface TriagemEmLoteResult {
  sucesso: string[];
  falhas: Array<{ demandaId: string; erro: string }>;
}

@CommandHandler(TriarDemandasEmLoteCommand)
export class TriarDemandasEmLoteHandler
  implements ICommandHandler<TriarDemandasEmLoteCommand, TriagemEmLoteResult>
{
  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: TriarDemandasEmLoteCommand): Promise<TriagemEmLoteResult> {
    const { tenantId, demandaIds, triadoPorId } = command;

    const resultado: TriagemEmLoteResult = {
      sucesso: [],
      falhas: [],
    };

    // Processar cada demanda individualmente
    for (const demandaId of demandaIds) {
      try {
        const triarCommand = new TriarDemandaCommand(
          tenantId,
          demandaId,
          triadoPorId,
          StatusTriagemEnum.PENDENTE_TRIAGEM as string,
        );

        await this.commandBus.execute(triarCommand);
        resultado.sucesso.push(demandaId);
      } catch (error) {
        resultado.falhas.push({
          demandaId,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return resultado;
  }
}
