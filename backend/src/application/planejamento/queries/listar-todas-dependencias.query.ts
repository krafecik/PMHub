export class ListarTodasDependenciasQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filtros: {
      featureId?: string;
      epicoId?: string;
      quarter?: string;
    } = {},
  ) {}
}
