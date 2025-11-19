export class ObterEstatisticasTriagemQuery {
  constructor(
    public readonly tenantId: string,
    public readonly periodo?: {
      dataInicio?: Date;
      dataFim?: Date;
    },
  ) {}
}
