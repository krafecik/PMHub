import { PlanningCycle } from '../entities';

export interface PlanningCycleRepository {
  save(cycle: PlanningCycle): Promise<string>;
  findById(id: string, tenantId: string): Promise<PlanningCycle | null>;
  findActiveByQuarter(tenantId: string, quarter: string): Promise<PlanningCycle | null>;
  list(
    tenantId: string,
    filters?: { quarter?: string; produtoId?: string },
  ): Promise<PlanningCycle[]>;
  delete(id: string, tenantId: string): Promise<void>;
}
