export class ListarCapacidadeQuery {
  constructor(
    public readonly tenantId: string,
    public readonly quarter: string,
  ) {}
}
