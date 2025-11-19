export class ListarPlanningCyclesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filters: {
      quarter?: string;
      produtoId?: string;
    } = {},
  ) {}
}
