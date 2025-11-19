export class CriarOuAtualizarFeatureCommand {
  constructor(
    public readonly tenantId: string,
    public readonly payload: {
      featureId?: string;
      epicoId: string;
      titulo: string;
      descricao?: string;
      squadId?: string;
      pontos?: number;
      status?: string;
      riscos?: string;
      criteriosAceite?: string;
      dependenciasIds?: string[];
      revisadoPorId?: string;
    },
  ) {}
}
