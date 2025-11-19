import { Feature } from '../entities';

export interface ListarFeaturesFiltro {
  tenantId: string;
  epicoId?: string;
  squadId?: string;
  quarter?: string;
  status?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FeatureRepository {
  save(feature: Feature): Promise<string>;
  saveMany(features: Feature[]): Promise<void>;
  findById(id: string, tenantId: string): Promise<Feature | null>;
  listByEpico(epicoId: string, tenantId: string): Promise<Feature[]>;
  list(filter: ListarFeaturesFiltro): Promise<{ data: Feature[]; total: number }>;
}
