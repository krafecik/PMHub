import { IEvent } from '@nestjs/cqrs';

export class DemandaEvoluiuParaDiscoveryEvent implements IEvent {
  constructor(
    public readonly demandaId: string,
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly dados: {
      titulo: string;
      descricao?: string;
      tipo: string;
      origem: string;
      produtoId: string;
      impacto: string;
      urgencia: string;
      complexidade: string;
    },
    public readonly usuarioId: string,
    public readonly ocorridoEm: Date = new Date(),
  ) {}
}
