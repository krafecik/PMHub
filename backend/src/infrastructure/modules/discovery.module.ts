import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../database/prisma.module';
import { DiscoveryController } from '../http/controllers/discovery.controller';
import { DiscoveryHttpService } from '../http/services/discovery.service';
import { DiscoveryActivityLogHandler } from '../../application/discovery/events/discovery-activity-log.handler';
import { DiscoveryCommandHandlers } from '../../application/discovery/commands';
import { DiscoveryQueryHandlers } from '../../application/discovery/queries';
import { DiscoveryPrismaRepository } from '../repositories/discovery/discovery.repository';
import { HipotesePrismaRepository } from '../repositories/discovery/hipotese.repository';
import { PesquisaPrismaRepository } from '../repositories/discovery/pesquisa.repository';
import { EntrevistaPrismaRepository } from '../repositories/discovery/entrevista.repository';
import { EvidenciaPrismaRepository } from '../repositories/discovery/evidencia.repository';
import { InsightPrismaRepository } from '../repositories/discovery/insight.repository';
import { ExperimentoPrismaRepository } from '../repositories/discovery/experimento.repository';
import { DecisaoDiscoveryPrismaRepository } from '../repositories/discovery/decisao-discovery.repository';
import { CatalogoRepository } from '../repositories/catalog/catalog.repository';
import { CATALOGO_REPOSITORY_TOKEN } from '@domain/catalog/catalog.repository.interface';
import {
  DiscoveryCriadoEvent,
  DiscoveryFinalizadoEvent,
  HipoteseValidadaEvent,
  InsightGeradoEvent,
  ExperimentoConcluidoEvent,
} from '../../domain/discovery/events';
import { DiscoveryAiService } from '@application/discovery/services';
import { AiModule } from '@infra/ai/ai.module';

// Repository Providers
const repositoryProviders = [
  {
    provide: 'IDiscoveryRepository',
    useClass: DiscoveryPrismaRepository,
  },
  {
    provide: 'IHipoteseRepository',
    useClass: HipotesePrismaRepository,
  },
  {
    provide: 'IPesquisaRepository',
    useClass: PesquisaPrismaRepository,
  },
  {
    provide: 'IEntrevistaRepository',
    useClass: EntrevistaPrismaRepository,
  },
  {
    provide: 'IEvidenciaRepository',
    useClass: EvidenciaPrismaRepository,
  },
  {
    provide: 'IInsightRepository',
    useClass: InsightPrismaRepository,
  },
  {
    provide: 'IExperimentoRepository',
    useClass: ExperimentoPrismaRepository,
  },
  {
    provide: 'IDecisaoDiscoveryRepository',
    useClass: DecisaoDiscoveryPrismaRepository,
  },
  {
    provide: CATALOGO_REPOSITORY_TOKEN,
    useClass: CatalogoRepository,
  },
];

// Event Publishers
const eventPublishers = [
  DiscoveryCriadoEvent,
  DiscoveryFinalizadoEvent,
  HipoteseValidadaEvent,
  InsightGeradoEvent,
  ExperimentoConcluidoEvent,
];

@Module({
  imports: [CqrsModule, PrismaModule, AiModule],
  controllers: [DiscoveryController],
  providers: [
    ...DiscoveryCommandHandlers,
    ...DiscoveryQueryHandlers,
    DiscoveryActivityLogHandler,
    ...repositoryProviders,
    ...eventPublishers.map((event) => ({
      provide: event.name,
      useValue: event,
    })),
    DiscoveryHttpService,
    DiscoveryAiService,
  ],
  exports: [...repositoryProviders],
})
export class DiscoveryModule {}
