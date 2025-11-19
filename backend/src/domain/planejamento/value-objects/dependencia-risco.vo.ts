export enum DependenciaRisco {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAIXO = 'BAIXO',
}

const LABELS: Record<DependenciaRisco, string> = {
  [DependenciaRisco.ALTO]: 'Alto',
  [DependenciaRisco.MEDIO]: 'Médio',
  [DependenciaRisco.BAIXO]: 'Baixo',
};

export class DependenciaRiscoVO {
  private constructor(private readonly value: DependenciaRisco) {}

  static create(value: string): DependenciaRiscoVO {
    if (!Object.values(DependenciaRisco).includes(value as DependenciaRisco)) {
      throw new Error(`Risco de dependência inválido: ${value}`);
    }

    return new DependenciaRiscoVO(value as DependenciaRisco);
  }

  static fromEnum(value: DependenciaRisco): DependenciaRiscoVO {
    return new DependenciaRiscoVO(value);
  }

  getValue(): DependenciaRisco {
    return this.value;
  }

  getLabel(): string {
    return LABELS[this.value];
  }

  isCritical(): boolean {
    return this.value === DependenciaRisco.ALTO;
  }

  toString(): string {
    return this.value;
  }
}
