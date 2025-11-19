import { ChecklistEntry } from '@domain/planejamento';

export class CriarPlanningCycleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly payload: {
      produtoId?: string;
      quarter: string;
      checklist?: ChecklistEntry[];
      agendaUrl?: string;
      participantesConfirmados?: number;
      participantesTotais?: number;
      dadosPreparacao?: Record<string, unknown>;
    },
  ) {}
}
