import { CenarioRepository } from '@domain/planejamento';

export type IPlanejamentoCenarioRepository = CenarioRepository;

export const PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN = Symbol(
  'PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN',
);
