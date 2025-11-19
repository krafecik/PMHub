export class ObterPlanningDashboardQuery {
  constructor(
    public readonly tenantId: string,
    public readonly quarter: string,
    public readonly produtoId?: string,
  ) {}
}
