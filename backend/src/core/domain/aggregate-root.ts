import { Identifier } from './identifier';
import { DomainEvent } from '../../domain/shared/events/domain-event';

export abstract class AggregateRoot<TId extends Identifier = Identifier> {
  protected readonly _id: TId;
  private _domainEvents: DomainEvent[] = [];

  constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
