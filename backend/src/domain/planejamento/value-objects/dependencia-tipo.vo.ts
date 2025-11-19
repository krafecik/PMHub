export enum DependenciaTipo {
  HARD = 'HARD',
  SOFT = 'SOFT',
  RECURSO = 'RECURSO',
}

export class DependenciaTipoVO {
  private constructor(private readonly value: DependenciaTipo) {}

  static create(value: string): DependenciaTipoVO {
    if (!Object.values(DependenciaTipo).includes(value as DependenciaTipo)) {
      throw new Error(`Tipo de dependência inválido: ${value}`);
    }

    return new DependenciaTipoVO(value as DependenciaTipo);
  }

  static fromEnum(value: DependenciaTipo): DependenciaTipoVO {
    return new DependenciaTipoVO(value);
  }

  getValue(): DependenciaTipo {
    return this.value;
  }

  isHard(): boolean {
    return this.value === DependenciaTipo.HARD;
  }

  toString(): string {
    return this.value;
  }
}
