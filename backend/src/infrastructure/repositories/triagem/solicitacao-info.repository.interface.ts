import { SolicitacaoInfo } from '@domain/triagem';

export const SOLICITACAO_INFO_REPOSITORY_TOKEN = Symbol('SolicitacaoInfoRepository');

export interface SolicitacaoInfoRepository {
  findById(id: string): Promise<SolicitacaoInfo | null>;
  findByTriagem(triagemId: string): Promise<SolicitacaoInfo[]>;
  findByTenant(tenantId: string): Promise<SolicitacaoInfo[]>;
  findBySolicitante(solicitanteId: string): Promise<SolicitacaoInfo[]>;
  create(solicitacao: SolicitacaoInfo): Promise<SolicitacaoInfo>;
  update(solicitacao: SolicitacaoInfo): Promise<void>;
  delete(id: string): Promise<void>;
}
