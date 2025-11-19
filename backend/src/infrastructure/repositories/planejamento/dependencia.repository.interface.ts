import { DependenciaRepository } from '@domain/planejamento';

export type IPlanejamentoDependenciaRepository = DependenciaRepository;

export const PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN = Symbol(
  'PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN',
);
