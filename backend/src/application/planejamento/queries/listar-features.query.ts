export class ListarFeaturesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filtros: {
      epicoId?: string;
      squadId?: string;
      quarter?: string;
      status?: string[];
      search?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {}
}
