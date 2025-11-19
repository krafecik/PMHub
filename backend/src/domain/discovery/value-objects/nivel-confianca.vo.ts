export enum NivelConfiancaEnum {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  MUITO_ALTA = 'MUITO_ALTA',
}

export class NivelConfiancaVO {
  private static readonly VALID_LEVELS = Object.values(NivelConfiancaEnum);

  constructor(private readonly value: NivelConfiancaEnum) {
    if (!NivelConfiancaVO.VALID_LEVELS.includes(value)) {
      throw new Error(`Nível de confiança inválido: ${value}`);
    }
  }

  getValue(): NivelConfiancaEnum {
    return this.value;
  }

  getLabel(): string {
    const labels: Record<NivelConfiancaEnum, string> = {
      [NivelConfiancaEnum.BAIXA]: 'Baixa',
      [NivelConfiancaEnum.MEDIA]: 'Média',
      [NivelConfiancaEnum.ALTA]: 'Alta',
      [NivelConfiancaEnum.MUITO_ALTA]: 'Muito Alta',
    };
    return labels[this.value];
  }

  getScore(): number {
    const scores: Record<NivelConfiancaEnum, number> = {
      [NivelConfiancaEnum.BAIXA]: 1,
      [NivelConfiancaEnum.MEDIA]: 2,
      [NivelConfiancaEnum.ALTA]: 3,
      [NivelConfiancaEnum.MUITO_ALTA]: 4,
    };
    return scores[this.value];
  }

  equals(other: NivelConfiancaVO): boolean {
    return this.value === other.value;
  }
}
