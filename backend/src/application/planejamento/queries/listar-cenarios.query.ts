export class ListarCenariosQuery {
  constructor(
    public readonly tenantId: string,
    public readonly quarter: string,
  ) {}
}
