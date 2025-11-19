import { Commitment } from '../entities';

export interface ListarCommitmentsFiltro {
  tenantId: string;
  produtoId?: string;
  quarter?: string;
  planningCycleId?: string;
}

export interface CommitmentRepository {
  save(commitment: Commitment): Promise<void>;
  findById(id: string, tenantId: string): Promise<Commitment | null>;
  findByQuarter(tenantId: string, produtoId: string, quarter: string): Promise<Commitment | null>;
  listAll(filter: ListarCommitmentsFiltro): Promise<Commitment[]>;
}
