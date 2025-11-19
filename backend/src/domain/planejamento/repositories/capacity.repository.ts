import { CapacitySnapshot } from '../entities';

export interface CapacityRepository {
  save(snapshot: CapacitySnapshot): Promise<void>;
  findBySquadAndQuarter(
    tenantId: string,
    squadId: string,
    quarter: string,
  ): Promise<CapacitySnapshot | null>;
  listByQuarter(tenantId: string, quarter: string): Promise<CapacitySnapshot[]>;
}
