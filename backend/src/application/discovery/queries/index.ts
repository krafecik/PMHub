// Query classes
export { ListarDiscoveriesQuery } from './listar-discoveries.query';
export { ObterDiscoveryCompletoQuery } from './obter-discovery-completo.query';
export { BuscarInsightsRelacionadosQuery } from './buscar-insights-relacionados.query';
export { ObterEstatisticasDiscoveryQuery } from './obter-estatisticas-discovery.query';
export { ObterEntrevistaDetalheQuery } from './obter-entrevista-detalhe.query';

// Query handlers
export { ListarDiscoveriesHandler } from './listar-discoveries.query';
export { ObterDiscoveryCompletoHandler } from './obter-discovery-completo.query';
export { BuscarInsightsRelacionadosHandler } from './buscar-insights-relacionados.query';
export { ObterEstatisticasDiscoveryHandler } from './obter-estatisticas-discovery.query';

// Import handlers for array
import { ListarDiscoveriesHandler } from './listar-discoveries.query';
import { ObterDiscoveryCompletoHandler } from './obter-discovery-completo.query';
import { BuscarInsightsRelacionadosHandler } from './buscar-insights-relacionados.query';
import { ObterEstatisticasDiscoveryHandler } from './obter-estatisticas-discovery.query';
import { ObterEntrevistaDetalheHandler } from './obter-entrevista-detalhe.query';

// DTOs
export type { DiscoveryListItemDTO, PaginatedDiscoveriesDTO } from './listar-discoveries.query';
export type { DiscoveryCompletoDTO } from './obter-discovery-completo.query';
export type { InsightRelacionadoDTO } from './buscar-insights-relacionados.query';
export type { EstatisticasDiscoveryDTO } from './obter-estatisticas-discovery.query';
export type { EntrevistaDetalheDTO } from './obter-entrevista-detalhe.query';

// All handlers for module registration
export const DiscoveryQueryHandlers = [
  ListarDiscoveriesHandler,
  ObterDiscoveryCompletoHandler,
  BuscarInsightsRelacionadosHandler,
  ObterEstatisticasDiscoveryHandler,
  ObterEntrevistaDetalheHandler,
];
