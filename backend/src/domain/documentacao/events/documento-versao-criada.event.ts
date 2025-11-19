import { DomainEvent } from '@domain/shared/events/domain-event';

export class DocumentoVersaoCriadaEvent extends DomainEvent {
  constructor(
    private readonly documentoId: string,
    private readonly tenantId: string,
    private readonly versao: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.documentoId;
  }

  getEventName(): string {
    return 'documentacao.documento_versao_criada';
  }

  getPayload(): Record<string, any> {
    return {
      documentoId: this.documentoId,
      tenantId: this.tenantId,
      versao: this.versao,
    };
  }
}
