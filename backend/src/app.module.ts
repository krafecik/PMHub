import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema, loadEnv } from './config/env.config';
import { PrismaModule } from '@infra/database';
import { AuthModule } from '@interfaces/auth/auth.module';
import { PlanejamentoModule } from '@modules/planejamento/planejamento.module';
import { EstrategiaModule } from '@modules/estrategia/estrategia.module';
import { IdeiasModule } from '@modules/ideias/ideias.module';
import { DiscoveryModule } from '@infra/modules/discovery.module';
import { DocumentacaoModule } from '@modules/documentacao/documentacao.module';
import { ValidacaoModule } from '@modules/validacao/validacao.module';
import { MetricasModule } from '@modules/metricas/metricas.module';
import { GovernancaModule } from '@modules/governanca/governanca.module';
import { DemandasModule } from '@modules/demandas/demandas.module';
import { MetricsModule } from '@core/metrics/metrics.module';
import { HealthModule } from '@interfaces/http/health/health.module';
import { TenantContextMiddleware } from '@interfaces/http/middlewares/tenant-context.middleware';
import { TriagemModule } from '@infra/modules/triagem.module';
import { CatalogosModule } from '@modules/catalogos/catalogos.module';
import { AiModule } from '@infra/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadEnv],
      validate: (config) => envSchema.parse(config),
    }),
    PrismaModule,
    AuthModule,
    PlanejamentoModule,
    EstrategiaModule,
    IdeiasModule,
    DiscoveryModule,
    DocumentacaoModule,
    ValidacaoModule,
    MetricasModule,
    GovernancaModule,
    DemandasModule,
    CatalogosModule,
    AiModule,
    TriagemModule,
    MetricsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
