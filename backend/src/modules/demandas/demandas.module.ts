import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DemandasController } from './demandas.controller';
import { DemandasService } from './demandas.service';
import { PrismaModule } from '@infra/database';
import { DemandaRepository } from '@infra/repositories/demandas/demanda.repository';
import { DEMANDA_REPOSITORY_TOKEN } from '@infra/repositories/demandas/demanda.repository.interface';
import { CriarDemandaRapidaHandler } from '@application/demandas/commands/criar-demanda-rapida.handler';
import { AdicionarComentarioHandler } from '@application/demandas/commands/adicionar-comentario.handler';
import { AdicionarAnexoHandler } from '@application/demandas/commands/adicionar-anexo.handler';
import { AtualizarDemandaHandler } from '@application/demandas/commands/atualizar-demanda.handler';
import { ListarDemandasHandler } from '@application/demandas/queries/listar-demandas.handler';
import { BuscarDemandaPorIdHandler } from '@application/demandas/queries/buscar-demanda-por-id.handler';
import { ListarComentariosHandler } from '@application/demandas/queries/listar-comentarios.handler';
import { ListarAnexosHandler } from '@application/demandas/queries/listar-anexos.handler';
import { ComentarioRepository } from '@infra/repositories/demandas/comentario.repository';
import { COMENTARIO_REPOSITORY_TOKEN } from '@infra/repositories/demandas/comentario.repository.interface';
import { AnexoRepository } from '@infra/repositories/demandas/anexo.repository';
import { ANEXO_REPOSITORY_TOKEN } from '@infra/repositories/demandas/anexo.repository.interface';
import { StorageService } from '@infra/storage/storage.service';

const CommandHandlers = [CriarDemandaRapidaHandler, AdicionarComentarioHandler, AdicionarAnexoHandler, AtualizarDemandaHandler];
const QueryHandlers = [ListarDemandasHandler, BuscarDemandaPorIdHandler, ListarComentariosHandler, ListarAnexosHandler];
const EventHandlers: any[] = [];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [DemandasController],
  providers: [
    DemandasService,
    StorageService,
    {
      provide: DEMANDA_REPOSITORY_TOKEN,
      useClass: DemandaRepository,
    },
    {
      provide: COMENTARIO_REPOSITORY_TOKEN,
      useClass: ComentarioRepository,
    },
    {
      provide: ANEXO_REPOSITORY_TOKEN,
      useClass: AnexoRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [DEMANDA_REPOSITORY_TOKEN, COMENTARIO_REPOSITORY_TOKEN, ANEXO_REPOSITORY_TOKEN],
})
export class DemandasModule {}
