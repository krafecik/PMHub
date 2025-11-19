export class AtualizarCapacidadeSquadCommand {
  constructor(
    public readonly tenantId: string,
    public readonly squadId: string,
    public readonly quarter: string,
    public readonly capacidadeTotal: number,
    public readonly capacidadeUsada: number,
    public readonly bufferPercentual: number,
    public readonly ajustes?: Record<string, unknown>,
  ) {}
}
