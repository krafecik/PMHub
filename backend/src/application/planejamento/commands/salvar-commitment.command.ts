export interface CommitmentTierInput {
  committed?: { epicoId: string; titulo: string; squadId?: string; confianca?: string }[];
  targeted?: { epicoId: string; titulo: string; squadId?: string; confianca?: string }[];
  aspirational?: { epicoId: string; titulo: string; squadId?: string; confianca?: string }[];
}

export class SalvarCommitmentCommand {
  constructor(
    public readonly tenantId: string,
    public readonly produtoId: string,
    public readonly quarter: string,
    public readonly planningCycleId?: string,
    public readonly documentoUrl?: string,
    public readonly itens?: CommitmentTierInput,
    public readonly assinaturas?: { papel: string; usuarioId: string }[],
  ) {}
}
