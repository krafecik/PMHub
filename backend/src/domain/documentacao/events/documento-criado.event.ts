import { DomainEvent } from '@domain/shared/events/domain-event';

export class DocumentoCriadoEvent extends DomainEvent {
  constructor(
    private readonly documentoId: string,
    private readonly tenantId: string,
    private readonly tipo: string,
    private readonly titulo: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.documentoId;
  }

  getEventName(): string {
    return 'documentacao.documento_criado';
  }

  getPayload(): Record<string, any> {
    return {
      documentoId: this.documentoId,
      tenantId: this.tenantId,
      tipo: this.tipo,
      titulo: this.titulo,
    };
  }
}
