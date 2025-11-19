export enum NivelComplexidadeEnum {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export class Complexidade {
  private readonly _value: NivelComplexidadeEnum;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Nível de complexidade inválido: ${value}`);
    }
    this._value = value as NivelComplexidadeEnum;
  }

  get value(): string {
    return this._value;
  }

  get peso(): number {
    const pesos: Record<NivelComplexidadeEnum, number> = {
      [NivelComplexidadeEnum.BAIXA]: 1,
      [NivelComplexidadeEnum.MEDIA]: 2,
      [NivelComplexidadeEnum.ALTA]: 3,
    };
    return pesos[this._value];
  }

  get diasEstimados(): number {
    const estimativas: Record<NivelComplexidadeEnum, number> = {
      [NivelComplexidadeEnum.BAIXA]: 5,
      [NivelComplexidadeEnum.MEDIA]: 15,
      [NivelComplexidadeEnum.ALTA]: 30,
    };
    return estimativas[this._value];
  }

  private isValid(value: string): boolean {
    return Object.values(NivelComplexidadeEnum).includes(value as NivelComplexidadeEnum);
  }

  static fromString(value: string): Complexidade {
    return new Complexidade(value);
  }

  static baixa(): Complexidade {
    return new Complexidade(NivelComplexidadeEnum.BAIXA);
  }

  static media(): Complexidade {
    return new Complexidade(NivelComplexidadeEnum.MEDIA);
  }

  static alta(): Complexidade {
    return new Complexidade(NivelComplexidadeEnum.ALTA);
  }

  isBaixa(): boolean {
    return this._value === NivelComplexidadeEnum.BAIXA;
  }

  isMedia(): boolean {
    return this._value === NivelComplexidadeEnum.MEDIA;
  }

  isAlta(): boolean {
    return this._value === NivelComplexidadeEnum.ALTA;
  }

  equals(other: Complexidade): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  // Método para calcular prioridade combinada com impacto e urgência
  calcularPrioridade(impacto: number, urgencia: number): number {
    // Formula: (impacto * 0.4) + (urgencia * 0.4) + ((4 - complexidade) * 0.2)
    // Complexidade invertida porque menor complexidade = maior prioridade
    const complexidadeInvertida = 4 - this.peso;
    return impacto * 0.4 + urgencia * 0.4 + complexidadeInvertida * 0.2;
  }
}
