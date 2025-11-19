export interface SalvarSquadPayload {
  squadId?: string;
  nome: string;
  slug?: string;
  produtoId?: string;
  descricao?: string;
  corToken?: string;
  timezone?: string;
  capacidadePadrao?: number;
  status?: string;
}

export class SalvarSquadCommand {
  constructor(
    public readonly tenantId: string,
    public readonly payload: SalvarSquadPayload,
  ) {}
}
