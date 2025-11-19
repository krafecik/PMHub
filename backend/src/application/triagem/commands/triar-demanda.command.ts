export class TriarDemandaCommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly triadoPorId: string,
    public readonly novoStatus?: string,
    public readonly impacto?: string,
    public readonly urgencia?: string,
    public readonly complexidade?: string,
    public readonly observacoes?: string,
    public readonly checklistAtualizacoes?: { itemId: string; completed: boolean }[],
  ) {}
}
