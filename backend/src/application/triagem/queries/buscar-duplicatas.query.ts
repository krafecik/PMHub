export class BuscarDuplicatasQuery {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly limite?: number,
  ) {}
}
