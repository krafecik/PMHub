import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InformacaoSolicitadaEvent } from '@domain/triagem';
import { Inject, Logger } from '@nestjs/common';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import { UserRepository } from '@infra/repositories';
import { MailService } from '@infra/email/mail.service';

@EventsHandler(InformacaoSolicitadaEvent)
export class InformacaoSolicitadaEmailHandler implements IEventHandler<InformacaoSolicitadaEvent> {
  private readonly logger = new Logger(InformacaoSolicitadaEmailHandler.name);

  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async handle(event: InformacaoSolicitadaEvent): Promise<void> {
    try {
      const solicitante = await this.userRepository.findByIdWithTenants(
        BigInt(event.solicitanteId),
      );

      if (!solicitante?.email) {
        this.logger.warn(
          `Não foi possível enviar e-mail da solicitação ${event.solicitacaoId}: solicitante sem e-mail cadastrado.`,
        );
        return;
      }

      const demanda = await this.demandaRepository.findById(event.tenantId, event.demandaId);
      const demandaTitulo = demanda?.titulo ? demanda.titulo.getValue() : 'Demanda';

      await this.mailService.sendSolicitacaoInfoEmail({
        to: solicitante.email,
        nome: solicitante.nome,
        demandaTitulo,
        texto: event.texto,
        prazo: event.prazo,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido ao enviar solicitação.';
      this.logger.error(
        `Falha ao enviar e-mail da solicitação ${event.solicitacaoId}: ${mensagem}`,
      );
    }
  }
}
