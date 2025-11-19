// ID Value Objects
export { DiscoveryId } from './discovery-id.vo';
export { HipoteseId } from './hipotese-id.vo';
export { PesquisaId } from './pesquisa-id.vo';
export { EntrevistaId } from './entrevista-id.vo';
export { EvidenciaId } from './evidencia-id.vo';
export { InsightId } from './insight-id.vo';
export { ExperimentoId } from './experimento-id.vo';
export { DecisaoDiscoveryId } from './decisao-discovery-id.vo';

// Status Value Objects
export { StatusDiscoveryVO, StatusDiscoveryEnum } from './status-discovery.vo';
export { StatusHipoteseVO, StatusHipoteseEnum } from './status-hipotese.vo';
export { StatusPesquisaVO, StatusPesquisaEnum } from './status-pesquisa.vo';
export { StatusInsightVO, StatusInsightEnum } from './status-insight.vo';
export { StatusExperimentoVO, StatusExperimentoEnum } from './status-experimento.vo';
export { SeveridadeProblemaVO } from './severidade-problema.vo';

// Other Value Objects
export { ImpactoHipoteseVO } from './impacto-hipotese.vo';
export { PrioridadeHipoteseVO } from './prioridade-hipotese.vo';
export { MetodoPesquisaVO } from './metodo-pesquisa.vo';
export { NivelConfiancaVO, NivelConfiancaEnum } from './nivel-confianca.vo';
export { TipoEvidenciaVO, TipoEvidenciaEnum } from './tipo-evidencia.vo';
export { ImpactoInsightVO } from './impacto-insight.vo';
export { ConfiancaInsightVO } from './confianca-insight.vo';
export { TipoExperimentoVO } from './tipo-experimento.vo';
export { MetricaSucessoExperimentoVO } from './metrica-sucesso-experimento.vo';

// Re-export shared value objects from triagem domain
export {
  Impacto as NivelImpactoVO,
  NivelImpactoEnum,
} from '../../triagem/value-objects/impacto.vo';
export { PrioridadeVO, Prioridade } from '../../demandas/value-objects/prioridade.vo';
