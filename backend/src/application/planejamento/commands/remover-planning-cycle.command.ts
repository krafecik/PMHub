export class RemoverPlanningCycleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly cycleId: string,
  ) {}
}
