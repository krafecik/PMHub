import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DocumentacaoController } from './documentacao.controller';
import { PrismaModule } from '@infra/database';
import { DocumentacaoCommandHandlers } from '@application/documentacao/commands';
import { DocumentacaoQueryHandlers } from '@application/documentacao/queries';
import { DOCUMENTO_REPOSITORY_TOKEN } from '@domain/documentacao';
import { PrismaDocumentoRepository } from '@infra/repositories/documentacao/documento.repository';
import { DocumentacaoAiService } from '@application/documentacao/services';
import { AiModule } from '@infra/ai/ai.module';

@Module({
  imports: [CqrsModule, PrismaModule, AiModule],
  controllers: [DocumentacaoController],
  providers: [
    {
      provide: DOCUMENTO_REPOSITORY_TOKEN,
      useClass: PrismaDocumentoRepository,
    },
    ...DocumentacaoCommandHandlers,
    ...DocumentacaoQueryHandlers,
    DocumentacaoAiService,
  ],
  exports: [DOCUMENTO_REPOSITORY_TOKEN],
})
export class DocumentacaoModule {}
