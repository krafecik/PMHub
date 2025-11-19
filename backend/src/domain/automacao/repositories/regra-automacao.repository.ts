import { RegraAutomacao } from '../entities/regra-automacao.entity';

export interface IRegraAutomacaoRepository {
  save(regra: RegraAutomacao): Promise<void>;
  findById(tenantId: string, id: string): Promise<RegraAutomacao | null>;
  findByTenant(tenantId: string): Promise<RegraAutomacao[]>;
  findAtivasByTenant(tenantId: string): Promise<RegraAutomacao[]>;
  delete(tenantId: string, id: string): Promise<void>;
}
