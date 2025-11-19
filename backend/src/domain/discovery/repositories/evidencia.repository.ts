import { Evidencia } from '../entities/evidencia.entity';
import { EvidenciaId, DiscoveryId, HipoteseId, TipoEvidenciaEnum } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

export interface EvidenciaFilters {
  discoveryId?: string;
  hipoteseId?: string;
  tipo?: TipoEvidenciaEnum[];
  tags?: string[];
}

export interface IEvidenciaRepository {
  findById(tenantId: TenantId, id: EvidenciaId): Promise<Evidencia | null>;

  findByIds(tenantId: TenantId, ids: string[]): Promise<Evidencia[]>;

  findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Evidencia[]>;

  findByHipotese(tenantId: TenantId, hipoteseId: HipoteseId): Promise<Evidencia[]>;

  findAll(tenantId: TenantId, filters?: EvidenciaFilters): Promise<Evidencia[]>;

  save(evidencia: Evidencia): Promise<Evidencia>;

  update(evidencia: Evidencia): Promise<Evidencia>;

  delete(tenantId: TenantId, id: EvidenciaId): Promise<void>;

  countByTipo(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
    tipo: TipoEvidenciaEnum,
  ): Promise<number>;
}
