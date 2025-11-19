export class CriarOuAtualizarEpicoCommand {
  constructor(
    public readonly tenantId: string,
    public readonly payload: {
      epicoId?: string;
      produtoId: string;
      planningCycleId?: string;
      squadId?: string;
      titulo: string;
      descricao?: string;
      objetivo?: string;
      valueProposition?: string;
      criteriosAceite?: string;
      riscos?: string;
      quarter: string;
      ownerId: string;
      sponsorId?: string;
      status?: string;
      health?: string;
      progressPercent?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {}
}
