import { ICommand } from '@nestjs/cqrs';

export class TriarDemandasEmLoteCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaIds: string[],
    public readonly triadoPorId: string,
  ) {}
}
