export class ObterFeatureDetalheQuery {
  constructor(
    public readonly tenantId: string,
    public readonly featureId: string,
  ) {}
}
