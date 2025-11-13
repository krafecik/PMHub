export enum OrigemDemanda {
  CLIENTE = 'CLIENTE',
  SUPORTE = 'SUPORTE',
  DIRETORIA = 'DIRETORIA',
  CS = 'CS',
  VENDAS = 'VENDAS',
  INTERNO = 'INTERNO',
}

export class OrigemDemandaVO {
  private constructor(private readonly value: OrigemDemanda) {}

  static create(value: string): OrigemDemandaVO {
    if (!Object.values(OrigemDemanda).includes(value as OrigemDemanda)) {
      throw new Error(`Origem de demanda inválida: ${value}`);
    }
    return new OrigemDemandaVO(value as OrigemDemanda);
  }

  static fromEnum(value: OrigemDemanda): OrigemDemandaVO {
    return new OrigemDemandaVO(value);
  }

  getValue(): OrigemDemanda {
    return this.value;
  }

  getLabel(): string {
    const labels = {
      [OrigemDemanda.CLIENTE]: 'Cliente',
      [OrigemDemanda.SUPORTE]: 'Suporte',
      [OrigemDemanda.DIRETORIA]: 'Diretoria',
      [OrigemDemanda.CS]: 'Customer Success',
      [OrigemDemanda.VENDAS]: 'Vendas',
      [OrigemDemanda.INTERNO]: 'Interno',
    };
    return labels[this.value];
  }

  isExternal(): boolean {
    return [OrigemDemanda.CLIENTE, OrigemDemanda.SUPORTE].includes(this.value);
  }

  equals(other: OrigemDemandaVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
