import { ICommand } from '@nestjs/cqrs';

export class RemoverTagCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly tagId: string,
  ) {}
}
