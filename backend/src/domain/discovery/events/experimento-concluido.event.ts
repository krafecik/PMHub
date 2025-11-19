import { DomainEvent } from '../../shared/events/domain-event';

export class ExperimentoConcluidoEvent extends DomainEvent {
  constructor(
    public readonly experimentoId: string,
    public readonly discoveryId: string,
    public readonly tenantId: string,
    public readonly titulo: string,
    public readonly resultado: 'sucesso' | 'falha' | 'inconclusivo',
    public readonly pValue?: number,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.experimentoId;
  }

  getEventName(): string {
    return 'experimento.concluido';
  }
}
