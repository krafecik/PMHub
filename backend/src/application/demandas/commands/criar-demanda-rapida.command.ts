import { ICommand } from '@nestjs/cqrs';

export class CriarDemandaRapidaCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly titulo: string,
    public readonly tipo: string,
    public readonly produtoId: string,
    public readonly criadoPorId: string,
    public readonly descricao?: string,
    public readonly origem?: string,
    public readonly origemDetalhe?: string,
    public readonly prioridade?: string,
    public readonly status?: string,
    public readonly responsavelId?: string,
  ) {}
}
