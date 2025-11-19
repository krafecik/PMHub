import { DomainEvent } from '../../shared/events/domain-event';

export class InsightGeradoEvent extends DomainEvent {
  constructor(
    public readonly insightId: string,
    public readonly discoveryId: string,
    public readonly tenantId: string,
    public readonly descricao: string,
    public readonly impacto: string,
    public readonly confianca: string,
    public readonly fonte?: string, // entrevistaId or other source
  ) {
    super();
  }

  getAggregateId(): string {
    return this.insightId;
  }

  getEventName(): string {
    return 'insight.gerado';
  }
}
