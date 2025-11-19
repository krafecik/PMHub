export enum NivelUrgenciaEnum {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export class Urgencia {
  private readonly _value: NivelUrgenciaEnum;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Nível de urgência inválido: ${value}`);
    }
    this._value = value as NivelUrgenciaEnum;
  }

  get value(): string {
    return this._value;
  }

  get peso(): number {
    const pesos: Record<NivelUrgenciaEnum, number> = {
      [NivelUrgenciaEnum.BAIXA]: 1,
      [NivelUrgenciaEnum.MEDIA]: 2,
      [NivelUrgenciaEnum.ALTA]: 3,
    };
    return pesos[this._value];
  }

  get diasPrazo(): number {
    const prazos: Record<NivelUrgenciaEnum, number> = {
      [NivelUrgenciaEnum.BAIXA]: 30,
      [NivelUrgenciaEnum.MEDIA]: 15,
      [NivelUrgenciaEnum.ALTA]: 7,
    };
    return prazos[this._value];
  }

  private isValid(value: string): boolean {
    return Object.values(NivelUrgenciaEnum).includes(value as NivelUrgenciaEnum);
  }

  static fromString(value: string): Urgencia {
    return new Urgencia(value);
  }

  static baixa(): Urgencia {
    return new Urgencia(NivelUrgenciaEnum.BAIXA);
  }

  static media(): Urgencia {
    return new Urgencia(NivelUrgenciaEnum.MEDIA);
  }

  static alta(): Urgencia {
    return new Urgencia(NivelUrgenciaEnum.ALTA);
  }

  isBaixa(): boolean {
    return this._value === NivelUrgenciaEnum.BAIXA;
  }

  isMedia(): boolean {
    return this._value === NivelUrgenciaEnum.MEDIA;
  }

  isAlta(): boolean {
    return this._value === NivelUrgenciaEnum.ALTA;
  }

  equals(other: Urgencia): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
