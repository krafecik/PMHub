export enum EpicoHealth {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

const LABELS: Record<EpicoHealth, string> = {
  [EpicoHealth.GREEN]: 'Saudável',
  [EpicoHealth.YELLOW]: 'Atenção',
  [EpicoHealth.RED]: 'Crítico',
};

export class EpicoHealthVO {
  private constructor(private readonly value: EpicoHealth) {}

  static create(value: string): EpicoHealthVO {
    if (!Object.values(EpicoHealth).includes(value as EpicoHealth)) {
      throw new Error(`Health de épico inválido: ${value}`);
    }

    return new EpicoHealthVO(value as EpicoHealth);
  }

  static fromEnum(value: EpicoHealth): EpicoHealthVO {
    return new EpicoHealthVO(value);
  }

  static green(): EpicoHealthVO {
    return new EpicoHealthVO(EpicoHealth.GREEN);
  }

  getValue(): EpicoHealth {
    return this.value;
  }

  getLabel(): string {
    return LABELS[this.value];
  }

  isCritical(): boolean {
    return this.value === EpicoHealth.RED;
  }

  toString(): string {
    return this.value;
  }
}
