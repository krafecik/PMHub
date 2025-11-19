export class ObterEpicoDetalheQuery {
  constructor(
    public readonly tenantId: string,
    public readonly epicoId: string,
  ) {}
}
