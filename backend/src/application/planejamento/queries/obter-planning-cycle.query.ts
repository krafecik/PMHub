export class ObterPlanningCycleQuery {
  constructor(
    public readonly tenantId: string,
    public readonly cycleId: string,
  ) {}
}
