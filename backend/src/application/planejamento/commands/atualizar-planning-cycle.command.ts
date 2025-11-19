import { ChecklistEntry } from '@domain/planejamento';

export class AtualizarPlanningCycleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly cycleId: string,
    public readonly payload: {
      statusSlug?: string;
      faseAtual?: number;
      checklist?: ChecklistEntry[];
      participantesConfirmados?: number;
      participantesTotais?: number;
      agendaUrl?: string;
      dadosPreparacao?: Record<string, unknown>;
    },
  ) {}
}
