import { DomainEvent } from '../../shared/events/domain-event';

export class DiscoveryCriadoEvent extends DomainEvent {
  constructor(
    public readonly discoveryId: string,
    public readonly demandaId: string,
    public readonly tenantId: string,
    public readonly titulo: string,
    public readonly responsavelId: string,
    public readonly produtoId: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.discoveryId;
  }

  getEventName(): string {
    return 'discovery.criado';
  }
}
