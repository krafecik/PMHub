export class SolicitarInformacaoCommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly solicitadoPorId: string,
    public readonly solicitanteId: string,
    public readonly texto: string,
    public readonly prazo?: Date,
  ) {}
}
