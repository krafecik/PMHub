export enum Prioridade {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export class PrioridadeVO {
  private constructor(private readonly value: Prioridade) {}

  static create(value: string): PrioridadeVO {
    if (!Object.values(Prioridade).includes(value as Prioridade)) {
      throw new Error(`Prioridade inválida: ${value}`);
    }
    return new PrioridadeVO(value as Prioridade);
  }

  static fromEnum(value: Prioridade): PrioridadeVO {
    return new PrioridadeVO(value);
  }

  static default(): PrioridadeVO {
    return new PrioridadeVO(Prioridade.MEDIA);
  }

  getValue(): Prioridade {
    return this.value;
  }

  getLabel(): string {
    const labels = {
      [Prioridade.BAIXA]: 'Baixa',
      [Prioridade.MEDIA]: 'Média',
      [Prioridade.ALTA]: 'Alta',
      [Prioridade.CRITICA]: 'Crítica',
    };
    return labels[this.value];
  }

  getColor(): string {
    const colors = {
      [Prioridade.BAIXA]: 'blue',
      [Prioridade.MEDIA]: 'yellow',
      [Prioridade.ALTA]: 'orange',
      [Prioridade.CRITICA]: 'red',
    };
    return colors[this.value];
  }

  getNumericValue(): number {
    const values = {
      [Prioridade.BAIXA]: 1,
      [Prioridade.MEDIA]: 2,
      [Prioridade.ALTA]: 3,
      [Prioridade.CRITICA]: 4,
    };
    return values[this.value];
  }

  isHighPriority(): boolean {
    return [Prioridade.ALTA, Prioridade.CRITICA].includes(this.value);
  }

  compareTo(other: PrioridadeVO): number {
    return this.getNumericValue() - other.getNumericValue();
  }

  equals(other: PrioridadeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
