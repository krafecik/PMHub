export * from './listar-demandas-pendentes.query';
export * from './listar-demandas-pendentes.handler';
export * from './buscar-duplicatas.query';
export * from './buscar-duplicatas.handler';
export * from './obter-estatisticas-triagem.query';
export * from './obter-estatisticas-triagem.handler';
export * from './obter-sinais-triagem.query';
export * from './obter-sugestoes-triagem.query';
export * from './obter-historico-solucoes.query';

import { ListarDemandasPendentesHandler } from './listar-demandas-pendentes.handler';
import { BuscarDuplicatasHandler } from './buscar-duplicatas.handler';
import { ObterEstatisticasTriagemHandler } from './obter-estatisticas-triagem.handler';
import { ObterSinaisTriagemHandler } from './obter-sinais-triagem.query';
import { ObterSugestoesTriagemHandler } from './obter-sugestoes-triagem.query';
import { ObterHistoricoSolucoesHandler } from './obter-historico-solucoes.query';

export const TriagemQueryHandlers = [
  ListarDemandasPendentesHandler,
  BuscarDuplicatasHandler,
  ObterEstatisticasTriagemHandler,
  ObterSinaisTriagemHandler,
  ObterSugestoesTriagemHandler,
  ObterHistoricoSolucoesHandler,
];
