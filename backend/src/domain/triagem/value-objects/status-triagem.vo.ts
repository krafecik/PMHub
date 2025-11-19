export enum StatusTriagemEnum {
  PENDENTE_TRIAGEM = 'PENDENTE_TRIAGEM',
  AGUARDANDO_INFO = 'AGUARDANDO_INFO',
  RETOMADO_TRIAGEM = 'RETOMADO_TRIAGEM',
  PRONTO_DISCOVERY = 'PRONTO_DISCOVERY',
  EVOLUIU_EPICO = 'EVOLUIU_EPICO',
  ARQUIVADO_TRIAGEM = 'ARQUIVADO_TRIAGEM',
  DUPLICADO = 'DUPLICADO',
}

export class StatusTriagem {
  private readonly _value: StatusTriagemEnum;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Status de triagem inválido: ${value}`);
    }
    this._value = value as StatusTriagemEnum;
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    return Object.values(StatusTriagemEnum).includes(value as StatusTriagemEnum);
  }

  static fromString(value: string): StatusTriagem {
    return new StatusTriagem(value);
  }

  isPendente(): boolean {
    return this._value === StatusTriagemEnum.PENDENTE_TRIAGEM;
  }

  isAguardandoInfo(): boolean {
    return this._value === StatusTriagemEnum.AGUARDANDO_INFO;
  }

  isProntoDiscovery(): boolean {
    return this._value === StatusTriagemEnum.PRONTO_DISCOVERY;
  }

  isDuplicado(): boolean {
    return this._value === StatusTriagemEnum.DUPLICADO;
  }

  isArquivado(): boolean {
    return this._value === StatusTriagemEnum.ARQUIVADO_TRIAGEM;
  }

  canTransitionTo(newStatus: StatusTriagemEnum): boolean {
    const transitions: Record<StatusTriagemEnum, StatusTriagemEnum[]> = {
      [StatusTriagemEnum.PENDENTE_TRIAGEM]: [
        StatusTriagemEnum.AGUARDANDO_INFO,
        StatusTriagemEnum.PRONTO_DISCOVERY,
        StatusTriagemEnum.EVOLUIU_EPICO,
        StatusTriagemEnum.ARQUIVADO_TRIAGEM,
        StatusTriagemEnum.DUPLICADO,
      ],
      [StatusTriagemEnum.AGUARDANDO_INFO]: [
        StatusTriagemEnum.RETOMADO_TRIAGEM,
        StatusTriagemEnum.ARQUIVADO_TRIAGEM,
      ],
      [StatusTriagemEnum.RETOMADO_TRIAGEM]: [
        StatusTriagemEnum.AGUARDANDO_INFO,
        StatusTriagemEnum.PRONTO_DISCOVERY,
        StatusTriagemEnum.EVOLUIU_EPICO,
        StatusTriagemEnum.ARQUIVADO_TRIAGEM,
        StatusTriagemEnum.DUPLICADO,
      ],
      [StatusTriagemEnum.PRONTO_DISCOVERY]: [],
      [StatusTriagemEnum.EVOLUIU_EPICO]: [],
      [StatusTriagemEnum.ARQUIVADO_TRIAGEM]: [],
      [StatusTriagemEnum.DUPLICADO]: [],
    };

    return transitions[this._value].includes(newStatus);
  }

  equals(other: StatusTriagem): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
