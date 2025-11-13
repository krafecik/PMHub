export enum StatusDemanda {
  NOVO = 'NOVO',
  RASCUNHO = 'RASCUNHO',
  TRIAGEM = 'TRIAGEM',
  ARQUIVADO = 'ARQUIVADO',
}

export class StatusDemandaVO {
  private constructor(private readonly value: StatusDemanda) {}

  static create(value: string): StatusDemandaVO {
    if (!Object.values(StatusDemanda).includes(value as StatusDemanda)) {
      throw new Error(`Status de demanda inválido: ${value}`);
    }
    return new StatusDemandaVO(value as StatusDemanda);
  }

  static fromEnum(value: StatusDemanda): StatusDemandaVO {
    return new StatusDemandaVO(value);
  }

  static novo(): StatusDemandaVO {
    return new StatusDemandaVO(StatusDemanda.NOVO);
  }

  static rascunho(): StatusDemandaVO {
    return new StatusDemandaVO(StatusDemanda.RASCUNHO);
  }

  getValue(): StatusDemanda {
    return this.value;
  }

  getLabel(): string {
    const labels = {
      [StatusDemanda.NOVO]: 'Novo',
      [StatusDemanda.RASCUNHO]: 'Rascunho',
      [StatusDemanda.TRIAGEM]: 'Triagem',
      [StatusDemanda.ARQUIVADO]: 'Arquivado',
    };
    return labels[this.value];
  }

  canTransitionTo(newStatus: StatusDemandaVO): boolean {
    const allowedTransitions: Record<StatusDemanda, StatusDemanda[]> = {
      [StatusDemanda.NOVO]: [StatusDemanda.RASCUNHO, StatusDemanda.TRIAGEM, StatusDemanda.ARQUIVADO],
      [StatusDemanda.RASCUNHO]: [StatusDemanda.NOVO, StatusDemanda.TRIAGEM, StatusDemanda.ARQUIVADO],
      [StatusDemanda.TRIAGEM]: [StatusDemanda.ARQUIVADO],
      [StatusDemanda.ARQUIVADO]: [], // Não pode transicionar para nenhum status
    };

    return allowedTransitions[this.value].includes(newStatus.getValue());
  }

  isActive(): boolean {
    return this.value !== StatusDemanda.ARQUIVADO;
  }

  isEditable(): boolean {
    return [StatusDemanda.NOVO, StatusDemanda.RASCUNHO].includes(this.value);
  }

  equals(other: StatusDemandaVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
