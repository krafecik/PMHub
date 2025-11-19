import { Pesquisa } from '../entities/pesquisa.entity';
import { PesquisaId, DiscoveryId, StatusPesquisaEnum } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

export interface PesquisaFilters {
  discoveryId?: string;
  status?: StatusPesquisaEnum[];
  metodo?: string[];
}

export interface IPesquisaRepository {
  findById(tenantId: TenantId, id: PesquisaId): Promise<Pesquisa | null>;

  findByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<Pesquisa[]>;

  findAll(tenantId: TenantId, filters?: PesquisaFilters): Promise<Pesquisa[]>;

  save(pesquisa: Pesquisa): Promise<Pesquisa>;

  update(pesquisa: Pesquisa): Promise<Pesquisa>;

  delete(tenantId: TenantId, id: PesquisaId): Promise<void>;

  countByStatus(
    tenantId: TenantId,
    discoveryId: DiscoveryId,
    status: StatusPesquisaEnum,
  ): Promise<number>;

  countByDiscovery(tenantId: TenantId, discoveryId: DiscoveryId): Promise<number>;
}
