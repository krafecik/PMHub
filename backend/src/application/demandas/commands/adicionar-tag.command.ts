import { ICommand } from '@nestjs/cqrs';

export class AdicionarTagCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly tagNome: string,
  ) {}
}
