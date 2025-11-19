import { DomainEvent } from '../../shared/events/domain-event';

export class DiscoveryFinalizadoEvent extends DomainEvent {
  constructor(
    public readonly discoveryId: string,
    public readonly tenantId: string,
    public readonly statusFinal: string,
    public readonly resumo?: string,
    public readonly aprendizados?: string[],
    public readonly recomendacoes?: string[],
  ) {
    super();
  }

  getAggregateId(): string {
    return this.discoveryId;
  }

  getEventName(): string {
    return 'discovery.finalizado';
  }
}
