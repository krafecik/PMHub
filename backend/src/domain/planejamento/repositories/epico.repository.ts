import { Epico } from '../entities';

export interface ListarEpicosFiltro {
  tenantId: string;
  produtoId?: string;
  quarter?: string;
  squadId?: string;
  status?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface EpicoRepository {
  save(epico: Epico): Promise<string>;
  findById(id: string, tenantId: string): Promise<Epico | null>;
  list(filter: ListarEpicosFiltro): Promise<{ data: Epico[]; total: number }>;
  delete(id: string, tenantId: string): Promise<void>;
}
