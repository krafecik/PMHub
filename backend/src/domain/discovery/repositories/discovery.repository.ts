import { Discovery } from '../entities/discovery.entity';
import { DiscoveryId, StatusDiscoveryEnum } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';
import { ProductId } from '../../shared/value-objects/product-id.vo';

export interface DiscoveryFilters {
  status?: StatusDiscoveryEnum[];
  responsavelId?: string;
  produtoId?: string;
  criadoPorId?: string;
  searchTerm?: string;
}

export interface DiscoveryPaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'titulo';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedDiscoveries {
  items: Discovery[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IDiscoveryRepository {
  findById(tenantId: TenantId, id: DiscoveryId): Promise<Discovery | null>;

  findAll(
    tenantId: TenantId,
    filters?: DiscoveryFilters,
    pagination?: DiscoveryPaginationOptions,
  ): Promise<PaginatedDiscoveries>;

  findByDemandaId(tenantId: TenantId, demandaId: string): Promise<Discovery | null>;

  findByResponsavel(
    tenantId: TenantId,
    responsavelId: UserId,
    pagination?: DiscoveryPaginationOptions,
  ): Promise<PaginatedDiscoveries>;

  findByProduto(
    tenantId: TenantId,
    produtoId: ProductId,
    pagination?: DiscoveryPaginationOptions,
  ): Promise<PaginatedDiscoveries>;

  save(discovery: Discovery): Promise<Discovery>;

  update(discovery: Discovery): Promise<Discovery>;

  delete(tenantId: TenantId, id: DiscoveryId): Promise<void>;

  countByStatus(tenantId: TenantId, status: StatusDiscoveryEnum): Promise<number>;

  countByProduto(tenantId: TenantId, produtoId: ProductId): Promise<number>;
}
