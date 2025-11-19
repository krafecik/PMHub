import { Experimento } from '../entities/experimento.entity';
import { ExperimentoId, DiscoveryId, HipoteseId, StatusExperimentoEnum } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

export interface ExperimentoFilters {
  discoveryId?: string;
  hipoteseId?: string;
  status?: StatusExperimentoEnum[];
  tipo?: string[];
}

export interface IExperimentoRepository {
  findById(tenantId: TenantId, id: ExperimentoId): Promise<Experimento | null>;

  findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Experimento[]>;

  findByHipotese(tenantId: TenantId, hipoteseId: HipoteseId): Promise<Experimento[]>;

  findAll(tenantId: TenantId, filters?: ExperimentoFilters): Promise<Experimento[]>;

  save(experimento: Experimento): Promise<Experimento>;

  update(experimento: Experimento): Promise<Experimento>;

  delete(tenantId: TenantId, id: ExperimentoId): Promise<void>;

  countByStatus(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
    status: StatusExperimentoEnum,
  ): Promise<number>;

  countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number>;
}
