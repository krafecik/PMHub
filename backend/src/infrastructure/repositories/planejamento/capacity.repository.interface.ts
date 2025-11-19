import { CapacityRepository } from '@domain/planejamento';

export type IPlanejamentoCapacityRepository = CapacityRepository;

export const PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN = Symbol(
  'PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN',
);
