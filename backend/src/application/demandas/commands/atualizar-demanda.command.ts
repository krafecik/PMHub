import { ICommand } from '@nestjs/cqrs';

export class AtualizarDemandaCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly titulo?: string,
    public readonly descricao?: string,
    public readonly tipo?: string,
    public readonly origem?: string,
    public readonly origemDetalhe?: string,
    public readonly prioridade?: string,
    public readonly responsavelId?: string | null,
    public readonly status?: string,
  ) {}
}
