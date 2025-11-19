import { DecisaoDiscovery } from '../entities/decisao-discovery.entity';
import { DecisaoDiscoveryId, DiscoveryId } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

export interface IDecisaoDiscoveryRepository {
  findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<DecisaoDiscovery | null>;

  findById(tenantId: TenantId, id: DecisaoDiscoveryId): Promise<DecisaoDiscovery | null>;

  upsert(decisao: DecisaoDiscovery): Promise<DecisaoDiscovery>;
}
