export class DemandaCriadaEvent {
  constructor(
    public readonly demandaId: string,
    public readonly tenantId: string,
    public readonly titulo: string,
    public readonly tipo: string,
    public readonly produtoId: string,
    public readonly origem: string,
    public readonly criadoPorId: string,
    public readonly prioridade: string,
    public readonly occurredAt: Date = new Date(),
  ) {}

  getAggregateId(): string {
    return this.demandaId;
  }

  getEventName(): string {
    return 'demanda.criada';
  }

  getPayload(): Record<string, any> {
    return {
      demandaId: this.demandaId,
      tenantId: this.tenantId,
      titulo: this.titulo,
      tipo: this.tipo,
      produtoId: this.produtoId,
      origem: this.origem,
      criadoPorId: this.criadoPorId,
      prioridade: this.prioridade,
      occurredAt: this.occurredAt,
    };
  }
}
