// Command classes
export { CriarDiscoveryCommand } from './criar-discovery.command';
export { CriarHipoteseCommand } from './criar-hipotese.command';
export { RegistrarPesquisaCommand } from './registrar-pesquisa.command';
export { AdicionarEntrevistaCommand } from './adicionar-entrevista.command';
export { CriarEvidenciaCommand } from './criar-evidencia.command';
export { GerarInsightCommand } from './gerar-insight.command';
export { IniciarExperimentoCommand } from './iniciar-experimento.command';
export { FinalizarDiscoveryCommand } from './finalizar-discovery.command';
export { AtualizarStatusHipoteseCommand } from './atualizar-status-hipotese.command';
export { ConcluirExperimentoCommand } from './concluir-experimento.command';
export { AtualizarDiscoveryCommand } from './atualizar-discovery.command';

// Command handlers
export { CriarDiscoveryHandler } from './criar-discovery.command';
export { CriarHipoteseHandler } from './criar-hipotese.command';
export { RegistrarPesquisaHandler } from './registrar-pesquisa.command';
export { AdicionarEntrevistaHandler } from './adicionar-entrevista.command';
export { CriarEvidenciaHandler } from './criar-evidencia.command';
export { GerarInsightHandler } from './gerar-insight.command';
export { IniciarExperimentoHandler } from './iniciar-experimento.command';
export { FinalizarDiscoveryHandler } from './finalizar-discovery.command';
export { AtualizarStatusHipoteseHandler } from './atualizar-status-hipotese.command';
export { ConcluirExperimentoHandler } from './concluir-experimento.command';

// Import handlers for array
import { CriarDiscoveryHandler } from './criar-discovery.command';
import { CriarHipoteseHandler } from './criar-hipotese.command';
import { RegistrarPesquisaHandler } from './registrar-pesquisa.command';
import { AdicionarEntrevistaHandler } from './adicionar-entrevista.command';
import { CriarEvidenciaHandler } from './criar-evidencia.command';
import { GerarInsightHandler } from './gerar-insight.command';
import { IniciarExperimentoHandler } from './iniciar-experimento.command';
import { FinalizarDiscoveryHandler } from './finalizar-discovery.command';
import { AtualizarStatusHipoteseHandler } from './atualizar-status-hipotese.command';
import { ConcluirExperimentoHandler } from './concluir-experimento.command';
import { AtualizarDiscoveryHandler } from './atualizar-discovery.command';

// All handlers for module registration
export const DiscoveryCommandHandlers = [
  CriarDiscoveryHandler,
  CriarHipoteseHandler,
  RegistrarPesquisaHandler,
  AdicionarEntrevistaHandler,
  CriarEvidenciaHandler,
  GerarInsightHandler,
  IniciarExperimentoHandler,
  FinalizarDiscoveryHandler,
  AtualizarStatusHipoteseHandler,
  ConcluirExperimentoHandler,
  AtualizarDiscoveryHandler,
];
