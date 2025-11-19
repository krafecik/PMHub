import { Dependencia } from '../entities';

export interface ListarDependenciasFiltro {
  tenantId: string;
  featureId?: string;
  epicoId?: string;
  quarter?: string;
}

export interface DependenciaRepository {
  save(dependencia: Dependencia): Promise<void>;
  listByFeature(featureId: string, tenantId: string): Promise<Dependencia[]>;
  listAll(filter: ListarDependenciasFiltro): Promise<Dependencia[]>;
  deleteById(id: string, tenantId: string): Promise<void>;
}
