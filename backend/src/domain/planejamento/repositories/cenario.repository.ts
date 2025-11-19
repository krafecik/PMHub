import { CenarioSimulado } from '../entities';

export interface CenarioRepository {
  save(cenario: CenarioSimulado): Promise<string>;
  findById(id: string, tenantId: string): Promise<CenarioSimulado | null>;
  listByQuarter(tenantId: string, quarter: string): Promise<CenarioSimulado[]>;
}
