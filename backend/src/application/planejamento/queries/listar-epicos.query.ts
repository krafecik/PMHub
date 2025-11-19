export class ListarEpicosQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filtros: {
      produtoId?: string;
      quarter?: string;
      squadId?: string;
      status?: string[];
      search?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {}
}
