export class RemoverSquadCommand {
  constructor(
    public readonly tenantId: string,
    public readonly squadId: string,
  ) {}
}
