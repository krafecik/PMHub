import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlanejamentoController } from './planejamento.controller';
import {
  PlanejamentoEpicoRepository,
  PlanejamentoFeatureRepository,
  PlanejamentoDependenciaRepository,
  PlanejamentoCapacityRepository,
  PlanejamentoCommitmentRepository,
  PlanejamentoCenarioRepository,
  PlanningCyclePrismaRepository,
  PlanejamentoSquadRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
  PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
  PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
  PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
  PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN,
  PLANNING_CYCLE_REPOSITORY_TOKEN,
  PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { PrismaModule } from '@infra/database';
import {
  CriarOuAtualizarEpicoHandler,
  AtualizarStatusEpicoHandler,
  CriarOuAtualizarFeatureHandler,
  AtualizarStatusFeatureHandler,
  RegistrarDependenciaHandler,
  RemoverDependenciaHandler,
  AtualizarCapacidadeSquadHandler,
  SalvarCommitmentHandler,
  SalvarCenarioHandler,
  RecalcularCenarioHandler,
  AtualizarPlanningCycleHandler,
  SalvarSquadHandler,
  RemoverSquadHandler,
  CriarPlanningCycleHandler,
  RemoverPlanningCycleHandler,
} from '@application/planejamento/commands';
import {
  ListarEpicosHandler,
  ObterEpicoDetalheHandler,
  ListarFeaturesHandler,
  ObterFeatureDetalheHandler,
  ListarCapacidadeHandler,
  ListarCenariosHandler,
  ObterPlanningDashboardHandler,
  ObterTimelineHandler,
  ListarDependenciasHandler,
  ListarTodasDependenciasHandler,
  ListarCommitmentsHandler,
  ObterCommitmentDetalheHandler,
  ListarSquadsHandler,
  ListarPlanningCyclesHandler,
  ObterPlanningCycleHandler,
} from '@application/planejamento/queries';
import { ProdutoModule } from './produtos/produto.module';
import { PlanejamentoInsightService } from '@application/planejamento/services/planejamento-insight.service';
import { PlanejamentoAiService } from '@application/planejamento/services/planejamento-ai.service';
import { CatalogoRepository } from '@infra/repositories/catalog/catalog.repository';
import { CATALOGO_REPOSITORY_TOKEN } from '@domain/catalog/catalog.repository.interface';
import { AiModule } from '@infra/ai/ai.module';

const CommandHandlers = [
  CriarOuAtualizarEpicoHandler,
  AtualizarStatusEpicoHandler,
  CriarOuAtualizarFeatureHandler,
  AtualizarStatusFeatureHandler,
  RegistrarDependenciaHandler,
  RemoverDependenciaHandler,
  AtualizarCapacidadeSquadHandler,
  SalvarCommitmentHandler,
  SalvarCenarioHandler,
  RecalcularCenarioHandler,
  AtualizarPlanningCycleHandler,
  SalvarSquadHandler,
  RemoverSquadHandler,
  CriarPlanningCycleHandler,
  RemoverPlanningCycleHandler,
];

const QueryHandlers = [
  ListarEpicosHandler,
  ObterEpicoDetalheHandler,
  ListarFeaturesHandler,
  ObterFeatureDetalheHandler,
  ListarCapacidadeHandler,
  ListarCenariosHandler,
  ObterPlanningDashboardHandler,
  ObterTimelineHandler,
  ListarDependenciasHandler,
  ListarTodasDependenciasHandler,
  ListarCommitmentsHandler,
  ObterCommitmentDetalheHandler,
  ListarSquadsHandler,
  ListarPlanningCyclesHandler,
  ObterPlanningCycleHandler,
];

@Module({
  imports: [ProdutoModule, PrismaModule, CqrsModule, AiModule],
  controllers: [PlanejamentoController],
  providers: [
    {
      provide: PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
      useClass: PlanejamentoEpicoRepository,
    },
    {
      provide: PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
      useClass: PlanejamentoFeatureRepository,
    },
    {
      provide: PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
      useClass: PlanejamentoDependenciaRepository,
    },
    {
      provide: PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
      useClass: PlanejamentoCapacityRepository,
    },
    {
      provide: PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
      useClass: PlanejamentoCommitmentRepository,
    },
    {
      provide: PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN,
      useClass: PlanejamentoCenarioRepository,
    },
    {
      provide: PLANNING_CYCLE_REPOSITORY_TOKEN,
      useClass: PlanningCyclePrismaRepository,
    },
    {
      provide: PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN,
      useClass: PlanejamentoSquadRepository,
    },
    {
      provide: CATALOGO_REPOSITORY_TOKEN,
      useClass: CatalogoRepository,
    },
    PlanejamentoInsightService,
    PlanejamentoAiService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
    PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
    PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
    PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
    PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
    PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN,
    PLANNING_CYCLE_REPOSITORY_TOKEN,
    PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN,
  ],
})
export class PlanejamentoModule {}
