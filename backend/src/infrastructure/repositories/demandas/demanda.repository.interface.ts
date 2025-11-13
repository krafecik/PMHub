import { Demanda } from '@domain/demandas';

export const DEMANDA_REPOSITORY_TOKEN = Symbol('IDemandaRepository');

export interface IDemandaRepository {
  save(demanda: Demanda): Promise<string>;
  findById(tenantId: string, id: string): Promise<Demanda | null>;
  findAll(tenantId: string, filters?: DemandaFilters): Promise<DemandaPaginatedResult>;
  update(demanda: Demanda): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface DemandaFilters {
  status?: string[];
  tipo?: string[];
  produtoId?: string;
  responsavelId?: string;
  origem?: string[];
  prioridade?: string[];
  criadoPorId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface DemandaPaginatedResult {
  data: Demanda[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
