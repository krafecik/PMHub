import { Entrevista } from '../entities/entrevista.entity';
import { EntrevistaId, PesquisaId } from '../value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

export interface EntrevistaFilters {
  pesquisaId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  tags?: string[];
}

export interface IEntrevistaRepository {
  findById(tenantId: TenantId, id: EntrevistaId): Promise<Entrevista | null>;

  findByPesquisa(tenantId: TenantId, pesquisaId: PesquisaId): Promise<Entrevista[]>;

  findAll(tenantId: TenantId, filters?: EntrevistaFilters): Promise<Entrevista[]>;

  save(entrevista: Entrevista): Promise<Entrevista>;

  update(entrevista: Entrevista): Promise<Entrevista>;

  delete(tenantId: TenantId, id: EntrevistaId): Promise<void>;

  countByPesquisa(tenantId: TenantId, pesquisaId: PesquisaId): Promise<number>;
}
