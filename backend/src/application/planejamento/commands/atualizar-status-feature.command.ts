export class AtualizarStatusFeatureCommand {
  constructor(
    public readonly tenantId: string,
    public readonly featureId: string,
    public readonly status: string,
  ) {}
}
