import { DomainEvent } from '../../shared/events/domain-event';

export class HipoteseValidadaEvent extends DomainEvent {
  constructor(
    public readonly hipoteseId: string,
    public readonly discoveryId: string,
    public readonly tenantId: string,
    public readonly titulo: string,
    public readonly impacto: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.hipoteseId;
  }

  getEventName(): string {
    return 'hipotese.validada';
  }
}
