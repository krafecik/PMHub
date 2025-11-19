import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../database/prisma.module';
import { AutomacaoController } from '../http/controllers/automacao.controller';
import { RegraAutomacaoRepository } from '../repositories/automacao/regra-automacao.repository';
import { ExecutorRegrasService } from '@domain/automacao/services/executor-regras.service';
import {
  CriarRegraHandler,
  AtualizarRegraHandler,
  AlternarStatusRegraHandler,
  DeletarRegraHandler,
} from '@application/automacao/commands';
import { ListarRegrasHandler, ObterRegraHandler } from '@application/automacao/queries';
import { CatalogoRepository } from '../repositories/catalog/catalog.repository';
import { CATALOGO_REPOSITORY_TOKEN } from '@domain/catalog/catalog.repository.interface';

const commandHandlers = [
  CriarRegraHandler,
  AtualizarRegraHandler,
  AlternarStatusRegraHandler,
  DeletarRegraHandler,
];

const queryHandlers = [ListarRegrasHandler, ObterRegraHandler];

const repositories = [
  {
    provide: 'RegraAutomacaoRepository',
    useClass: RegraAutomacaoRepository,
  },
  {
    provide: CATALOGO_REPOSITORY_TOKEN,
    useClass: CatalogoRepository,
  },
];

const services = [ExecutorRegrasService];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AutomacaoController],
  providers: [...commandHandlers, ...queryHandlers, ...repositories, ...services],
  exports: [...repositories, ExecutorRegrasService],
})
export class AutomacaoModule {}
