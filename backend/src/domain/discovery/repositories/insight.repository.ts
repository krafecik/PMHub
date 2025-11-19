import { Insight } from '../entities/insight.entity';
import { InsightId, DiscoveryId, EntrevistaId, StatusInsightEnum } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

export interface InsightFilters {
  discoveryId?: string;
  entrevistaId?: string;
  status?: StatusInsightEnum[];
  impacto?: string[];
  confianca?: string[];
  tags?: string[];
}

export interface IInsightRepository {
  findById(tenantId: TenantId, id: InsightId): Promise<Insight | null>;

  findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Insight[]>;

  findByEntrevista(tenantId: TenantId, entrevistaId: EntrevistaId): Promise<Insight[]>;

  findAll(tenantId: TenantId, filters?: InsightFilters): Promise<Insight[]>;

  findRelatedByTags(
    tenantId: TenantId,
    tags: string[],
    excludeDiscoveryId?: DiscoveryId,
  ): Promise<Insight[]>;

  save(insight: Insight): Promise<Insight>;

  update(insight: Insight): Promise<Insight>;

  delete(tenantId: TenantId, id: InsightId): Promise<void>;

  countByStatus(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
    status: StatusInsightEnum,
  ): Promise<number>;

  countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number>;
}
