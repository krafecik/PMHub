import { TriagemDemanda } from '@domain/triagem';

export const TRIAGEM_REPOSITORY_TOKEN = Symbol('TriagemRepository');

export interface TriagemRepository {
  findById(id: string): Promise<TriagemDemanda | null>;
  findByDemandaId(demandaId: string, tenantId?: string): Promise<TriagemDemanda | null>;
  findManyByDemandaIds(demandaIds: string[]): Promise<TriagemDemanda[]>;
  findByTenantAndPeriodo(
    tenantId: string,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<TriagemDemanda[]>;
  create(triagem: TriagemDemanda): Promise<TriagemDemanda>;
  update(triagem: TriagemDemanda): Promise<void>;
  delete(id: string): Promise<void>;
}
