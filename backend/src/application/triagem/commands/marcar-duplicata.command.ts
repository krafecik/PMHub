export class MarcarDuplicataCommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly demandaOriginalId: string,
    public readonly marcadoPorId: string,
    public readonly similaridade?: number,
  ) {}
}
