import { ICommand } from '@nestjs/cqrs';

export class AdicionarAnexoCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly arquivo: Express.Multer.File,
    public readonly usuarioId: string,
  ) {}
}
