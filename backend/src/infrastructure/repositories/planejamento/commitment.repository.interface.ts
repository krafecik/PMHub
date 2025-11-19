import { CommitmentRepository } from '@domain/planejamento';

export type IPlanejamentoCommitmentRepository = CommitmentRepository;

export const PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN = Symbol(
  'PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN',
);
