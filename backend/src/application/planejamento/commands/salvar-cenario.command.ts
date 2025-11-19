import { AjusteCapacidade } from '@domain/planejamento';

export class SalvarCenarioCommand {
  constructor(
    public readonly tenantId: string,
    public readonly payload: {
      cenarioId?: string;
      planningCycleId?: string;
      quarter: string;
      nome: string;
      descricao?: string;
      statusSlug?: string;
      ajustesCapacidade?: AjusteCapacidade[];
      incluirContractors?: boolean;
      considerarFerias?: boolean;
      bufferRiscoPercentual?: number;
    },
  ) {}
}
