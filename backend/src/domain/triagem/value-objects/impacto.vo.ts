export enum NivelImpactoEnum {
  BAIXO = 'BAIXO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO',
}

export class Impacto {
  private readonly _value: NivelImpactoEnum;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Nível de impacto inválido: ${value}`);
    }
    this._value = value as NivelImpactoEnum;
  }

  get value(): string {
    return this._value;
  }

  get peso(): number {
    const pesos: Record<NivelImpactoEnum, number> = {
      [NivelImpactoEnum.BAIXO]: 1,
      [NivelImpactoEnum.MEDIO]: 2,
      [NivelImpactoEnum.ALTO]: 3,
      [NivelImpactoEnum.CRITICO]: 4,
    };
    return pesos[this._value];
  }

  private isValid(value: string): boolean {
    return Object.values(NivelImpactoEnum).includes(value as NivelImpactoEnum);
  }

  static fromString(value: string): Impacto {
    return new Impacto(value);
  }

  static baixo(): Impacto {
    return new Impacto(NivelImpactoEnum.BAIXO);
  }

  static medio(): Impacto {
    return new Impacto(NivelImpactoEnum.MEDIO);
  }

  static alto(): Impacto {
    return new Impacto(NivelImpactoEnum.ALTO);
  }

  static critico(): Impacto {
    return new Impacto(NivelImpactoEnum.CRITICO);
  }

  isBaixo(): boolean {
    return this._value === NivelImpactoEnum.BAIXO;
  }

  isMedio(): boolean {
    return this._value === NivelImpactoEnum.MEDIO;
  }

  isAlto(): boolean {
    return this._value === NivelImpactoEnum.ALTO;
  }

  isCritico(): boolean {
    return this._value === NivelImpactoEnum.CRITICO;
  }

  isHighPriority(): boolean {
    return this.isAlto() || this.isCritico();
  }

  equals(other: Impacto): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  getValue(): string {
    return this._value;
  }

  getLabel(): string {
    const labels: Record<NivelImpactoEnum, string> = {
      [NivelImpactoEnum.BAIXO]: 'Baixo',
      [NivelImpactoEnum.MEDIO]: 'Médio',
      [NivelImpactoEnum.ALTO]: 'Alto',
      [NivelImpactoEnum.CRITICO]: 'Crítico',
    };
    return labels[this._value];
  }

  getScore(): number {
    return this.peso;
  }
}
