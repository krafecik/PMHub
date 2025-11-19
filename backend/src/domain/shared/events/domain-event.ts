export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }

  abstract getAggregateId(): string;
  abstract getEventName(): string;

  getPayload(): Record<string, any> {
    return {};
  }
}
