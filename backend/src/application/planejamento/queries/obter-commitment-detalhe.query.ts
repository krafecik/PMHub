export class ObterCommitmentDetalheQuery {
  constructor(
    public readonly tenantId: string,
    public readonly commitmentId: string,
  ) {}
}
