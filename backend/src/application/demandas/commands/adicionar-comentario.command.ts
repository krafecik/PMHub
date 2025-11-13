import { ICommand } from '@nestjs/cqrs';

export class AdicionarComentarioCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly usuarioId: string,
    public readonly texto: string,
  ) {}
}
