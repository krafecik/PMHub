export class EvoluirParaEpicoCommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly nomeEpico: string,
    public readonly objetivoEpico: string,
    public readonly produtoId: string,
    public readonly evoluidoPorId: string,
  ) {}
}
