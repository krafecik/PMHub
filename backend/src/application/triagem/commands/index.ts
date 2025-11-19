export * from './triar-demanda.command';
export * from './triar-demanda.handler';
export * from './triar-demandas-em-lote.command';
export * from './triar-demandas-em-lote.handler';
export * from './solicitar-informacao.command';
export * from './solicitar-informacao.handler';
export * from './marcar-duplicata.command';
export * from './marcar-duplicata.handler';
export * from './evoluir-para-epico.command';
export * from './evoluir-para-epico.handler';
export * from './evoluir-para-discovery.command';
export * from './reatribuir-pm.command';

import { TriarDemandaHandler } from './triar-demanda.handler';
import { TriarDemandasEmLoteHandler } from './triar-demandas-em-lote.handler';
import { SolicitarInformacaoHandler } from './solicitar-informacao.handler';
import { MarcarDuplicataHandler } from './marcar-duplicata.handler';
import { EvoluirParaEpicoHandler } from './evoluir-para-epico.handler';
import { EvoluirParaDiscoveryHandler } from './evoluir-para-discovery.command';
import { ReatribuirPmHandler } from './reatribuir-pm.command';

export const TriagemCommandHandlers = [
  TriarDemandaHandler,
  TriarDemandasEmLoteHandler,
  SolicitarInformacaoHandler,
  MarcarDuplicataHandler,
  EvoluirParaEpicoHandler,
  EvoluirParaDiscoveryHandler,
  ReatribuirPmHandler,
];
