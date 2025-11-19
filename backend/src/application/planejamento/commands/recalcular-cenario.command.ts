export class RecalcularCenarioCommand {
  constructor(
    public readonly tenantId: string,
    public readonly cenarioId: string,
  ) {}
}
