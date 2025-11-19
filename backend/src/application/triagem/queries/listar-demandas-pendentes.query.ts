export class ListarDemandasPendentesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filtros?: {
      produtoId?: string;
      tipo?: string | string[];
      origem?: string | string[];
      responsavelId?: string;
      status?: string | string[];
    },
    public readonly paginacao?: {
      page?: number;
      pageSize?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    },
  ) {}
}
