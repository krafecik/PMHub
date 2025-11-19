export class ObterTimelineQuery {
  constructor(
    public readonly tenantId: string,
    public readonly quarter: string,
  ) {}
}
