import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  DiscoveryCriadoEvent,
  HipoteseValidadaEvent,
  InsightGeradoEvent,
  ExperimentoConcluidoEvent,
} from '../../../domain/discovery/events';
import { IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { DiscoveryId } from '../../../domain/discovery/value-objects';

type SupportedEvents =
  | DiscoveryCriadoEvent
  | HipoteseValidadaEvent
  | InsightGeradoEvent
  | ExperimentoConcluidoEvent;

@EventsHandler(
  DiscoveryCriadoEvent,
  HipoteseValidadaEvent,
  InsightGeradoEvent,
  ExperimentoConcluidoEvent,
)
export class DiscoveryActivityLogHandler implements IEventHandler<SupportedEvents> {
  private readonly logger = new Logger(DiscoveryActivityLogHandler.name);

  constructor(
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
  ) {}

  async handle(event: SupportedEvents): Promise<void> {
    if (event instanceof DiscoveryCriadoEvent) {
      await this.appendLog(event.tenantId, event.discoveryId, 'discovery_criado', {
        titulo: event.titulo,
        demandaId: event.demandaId,
        responsavelId: event.responsavelId,
        produtoId: event.produtoId,
      });
      return;
    }

    if (event instanceof HipoteseValidadaEvent) {
      await this.appendLog(event.tenantId, event.discoveryId, 'hipotese_validada', {
        hipoteseId: event.hipoteseId,
        titulo: event.titulo,
        impacto: event.impacto,
      });
      return;
    }

    if (event instanceof InsightGeradoEvent) {
      await this.appendLog(event.tenantId, event.discoveryId, 'insight_gerado', {
        insightId: event.insightId,
        impacto: event.impacto,
        confianca: event.confianca,
        fonte: event.fonte ?? null,
      });
      return;
    }

    if (event instanceof ExperimentoConcluidoEvent) {
      await this.appendLog(event.tenantId, event.discoveryId, 'experimento_concluido', {
        experimentoId: event.experimentoId,
        titulo: event.titulo,
        resultado: event.resultado,
        pValue: event.pValue ?? null,
      });
    }
  }

  private async appendLog(
    tenantId: string,
    discoveryId: string,
    tipo: string,
    dados: Record<string, unknown>,
  ): Promise<void> {
    const discovery = await this.discoveryRepository.findById(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    if (!discovery) {
      this.logger.warn(
        `Discovery ${discoveryId} não encontrado para registrar atividade '${tipo}'`,
      );
      return;
    }

    discovery.registerActivity(tipo, dados);
    await this.discoveryRepository.update(discovery);
  }
}
