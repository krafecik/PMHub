import { Hipotese } from '../entities/hipotese.entity';
import { HipoteseId, DiscoveryId, StatusHipoteseEnum } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

export interface HipoteseFilters {
  discoveryId?: string;
  status?: StatusHipoteseEnum[];
  prioridade?: string[];
  impactoEsperado?: string[];
}

export interface IHipoteseRepository {
  findById(tenantId: TenantId, id: HipoteseId): Promise<Hipotese | null>;

  findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Hipotese[]>;

  findAll(tenantId: TenantId, filters?: HipoteseFilters): Promise<Hipotese[]>;

  save(hipotese: Hipotese): Promise<Hipotese>;

  update(hipotese: Hipotese): Promise<Hipotese>;

  delete(tenantId: TenantId, id: HipoteseId): Promise<void>;

  countByStatus(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
    status: StatusHipoteseEnum,
  ): Promise<number>;

  countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number>;
}
