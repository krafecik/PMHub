export class AtualizarStatusEpicoCommand {
  constructor(
    public readonly tenantId: string,
    public readonly epicoId: string,
    public readonly status: string,
    public readonly health?: string,
    public readonly progressPercent?: number,
  ) {}
}
