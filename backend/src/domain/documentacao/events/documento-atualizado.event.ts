import { DomainEvent } from '@domain/shared/events/domain-event';

export class DocumentoAtualizadoEvent extends DomainEvent {
  constructor(
    private readonly documentoId: string,
    private readonly tenantId: string,
    private readonly status: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.documentoId;
  }

  getEventName(): string {
    return 'documentacao.documento_atualizado';
  }

  getPayload(): Record<string, any> {
    return {
      documentoId: this.documentoId,
      tenantId: this.tenantId,
      status: this.status,
    };
  }
}
