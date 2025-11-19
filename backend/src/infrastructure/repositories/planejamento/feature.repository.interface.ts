import { FeatureRepository } from '@domain/planejamento';

export type IPlanejamentoFeatureRepository = FeatureRepository;

export const PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN = Symbol(
  'PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN',
);
