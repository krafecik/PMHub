import { ICommand } from '@nestjs/cqrs';

export class CancelarDemandaCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly motivoCancelamento: string,
  ) {}
}
