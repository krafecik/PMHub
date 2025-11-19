export class ListarCommitmentsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filtros: {
      produtoId?: string;
      quarter?: string;
      planningCycleId?: string;
    } = {},
  ) {}
}
