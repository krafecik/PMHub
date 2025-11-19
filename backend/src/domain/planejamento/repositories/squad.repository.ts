import { Squad } from '../entities';

export interface SquadRepository {
  save(squad: Squad): Promise<string>;
  findById(id: string, tenantId: string): Promise<Squad | null>;
  listByTenant(tenantId: string): Promise<Squad[]>;
  delete(id: string, tenantId: string): Promise<void>;
}
