import { EpicoRepository, ListarEpicosFiltro } from '@domain/planejamento';

export type IPlanejamentoEpicoRepository = EpicoRepository;
export type PlanejamentoEpicoFiltro = ListarEpicosFiltro;

export const PLANEJAMENTO_EPICO_REPOSITORY_TOKEN = Symbol('PLANEJAMENTO_EPICO_REPOSITORY_TOKEN');
