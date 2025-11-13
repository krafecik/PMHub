export enum TipoDemanda {
  IDEIA = 'IDEIA',
  PROBLEMA = 'PROBLEMA',
  OPORTUNIDADE = 'OPORTUNIDADE',
  OUTRO = 'OUTRO',
}

export class TipoDemandaVO {
  private constructor(private readonly value: TipoDemanda) {}

  static create(value: string): TipoDemandaVO {
    if (!Object.values(TipoDemanda).includes(value as TipoDemanda)) {
      throw new Error(`Tipo de demanda inválido: ${value}`);
    }
    return new TipoDemandaVO(value as TipoDemanda);
  }

  static fromEnum(value: TipoDemanda): TipoDemandaVO {
    return new TipoDemandaVO(value);
  }

  getValue(): TipoDemanda {
    return this.value;
  }

  getLabel(): string {
    const labels = {
      [TipoDemanda.IDEIA]: 'Ideia',
      [TipoDemanda.PROBLEMA]: 'Problema',
      [TipoDemanda.OPORTUNIDADE]: 'Oportunidade',
      [TipoDemanda.OUTRO]: 'Outro',
    };
    return labels[this.value];
  }

  equals(other: TipoDemandaVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
