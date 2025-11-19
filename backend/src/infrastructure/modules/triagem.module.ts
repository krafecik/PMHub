import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../database/prisma.module';
import { TriagemController } from '../http/controllers/triagem.controller';
import { PrismaTriagemRepository } from '../repositories/triagem/triagem.repository';
import { PrismaSolicitacaoInfoRepository } from '../repositories/triagem/solicitacao-info.repository';
import { PrismaDuplicatasRepository } from '../repositories/triagem/duplicatas.repository';
import { TRIAGEM_REPOSITORY_TOKEN } from '../repositories/triagem/triagem.repository.interface';
import { SOLICITACAO_INFO_REPOSITORY_TOKEN } from '../repositories/triagem/solicitacao-info.repository.interface';
import { DUPLICATAS_REPOSITORY_TOKEN } from '../repositories/triagem/duplicatas.repository.interface';
import { DeteccaoDuplicataService } from '@domain/triagem/services/deteccao-duplicata.service';
import { TriagemHandlers } from '@application/triagem';
import {
  TriagemAutomacaoService,
  TriagemAiDuplicacaoService,
  TriagemAiEncaminhamentoService,
} from '@application/triagem/services';
import { AnaliseSinaisService } from '@domain/triagem/services/analise-sinais.service';
import { SugestoesTriagemService } from '@domain/triagem/services/sugestoes-triagem.service';
import { DemandasModule } from '@modules/demandas/demandas.module';
import { DiscoveryModule } from './discovery.module';
import { AutomacaoModule } from './automacao.module';
import { UserRepository } from '@infra/repositories';
import { MailService } from '@infra/email/mail.service';
import { AiModule } from '@infra/ai/ai.module';

const repositories = [
  {
    provide: TRIAGEM_REPOSITORY_TOKEN,
    useClass: PrismaTriagemRepository,
  },
  {
    provide: SOLICITACAO_INFO_REPOSITORY_TOKEN,
    useClass: PrismaSolicitacaoInfoRepository,
  },
  {
    provide: DUPLICATAS_REPOSITORY_TOKEN,
    useClass: PrismaDuplicatasRepository,
  },
];

const services = [
  DeteccaoDuplicataService,
  TriagemAutomacaoService,
  TriagemAiDuplicacaoService,
  TriagemAiEncaminhamentoService,
  AnaliseSinaisService,
  SugestoesTriagemService,
  UserRepository,
  MailService,
];

@Module({
  imports: [CqrsModule, PrismaModule, DemandasModule, DiscoveryModule, AutomacaoModule, AiModule],
  controllers: [TriagemController],
  providers: [...TriagemHandlers, ...repositories, ...services],
  exports: [...repositories, DeteccaoDuplicataService],
})
export class TriagemModule {}
