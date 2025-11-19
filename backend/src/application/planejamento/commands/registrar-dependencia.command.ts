export class RegistrarDependenciaCommand {
  constructor(
    public readonly tenantId: string,
    public readonly featureBloqueadaId: string,
    public readonly featureBloqueadoraId: string,
    public readonly tipo: string,
    public readonly risco: string,
    public readonly nota?: string,
    public readonly dependenciaId?: string,
  ) {}
}
