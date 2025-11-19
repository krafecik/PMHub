export class RemoverDependenciaCommand {
  constructor(
    public readonly tenantId: string,
    public readonly dependenciaId: string,
  ) {}
}
