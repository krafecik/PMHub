export enum EpicoStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  AT_RISK = 'AT_RISK',
  DONE = 'DONE',
  ON_HOLD = 'ON_HOLD',
}

const EPICO_STATUS_LABELS: Record<EpicoStatus, string> = {
  [EpicoStatus.PLANNED]: 'Planejado',
  [EpicoStatus.IN_PROGRESS]: 'Em Progresso',
  [EpicoStatus.AT_RISK]: 'Em Risco',
  [EpicoStatus.DONE]: 'Concluído',
  [EpicoStatus.ON_HOLD]: 'Em Espera',
};

const EPICO_STATUS_TRANSITIONS: Record<EpicoStatus, EpicoStatus[]> = {
  [EpicoStatus.PLANNED]: [EpicoStatus.IN_PROGRESS, EpicoStatus.ON_HOLD, EpicoStatus.AT_RISK],
  [EpicoStatus.IN_PROGRESS]: [EpicoStatus.AT_RISK, EpicoStatus.DONE, EpicoStatus.ON_HOLD],
  [EpicoStatus.AT_RISK]: [EpicoStatus.IN_PROGRESS, EpicoStatus.ON_HOLD, EpicoStatus.DONE],
  [EpicoStatus.DONE]: [],
  [EpicoStatus.ON_HOLD]: [EpicoStatus.IN_PROGRESS, EpicoStatus.PLANNED],
};

export class EpicoStatusVO {
  private constructor(private readonly value: EpicoStatus) {}

  static create(value: string): EpicoStatusVO {
    if (!Object.values(EpicoStatus).includes(value as EpicoStatus)) {
      throw new Error(`Status de épico inválido: ${value}`);
    }

    return new EpicoStatusVO(value as EpicoStatus);
  }

  static fromEnum(value: EpicoStatus): EpicoStatusVO {
    return new EpicoStatusVO(value);
  }

  static planned(): EpicoStatusVO {
    return new EpicoStatusVO(EpicoStatus.PLANNED);
  }

  getValue(): EpicoStatus {
    return this.value;
  }

  getLabel(): string {
    return EPICO_STATUS_LABELS[this.value];
  }

  canTransitionTo(target: EpicoStatusVO): boolean {
    return EPICO_STATUS_TRANSITIONS[this.value].includes(target.getValue());
  }

  isFinal(): boolean {
    return this.value === EpicoStatus.DONE;
  }

  toString(): string {
    return this.value;
  }
}
