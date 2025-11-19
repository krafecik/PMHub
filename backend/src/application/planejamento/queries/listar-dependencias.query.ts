export class ListarDependenciasQuery {
  constructor(
    public readonly tenantId: string,
    public readonly featureId: string,
  ) {}
}
