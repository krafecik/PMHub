export enum FeatureStatus {
  BACKLOG = 'BACKLOG',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
  ON_HOLD = 'ON_HOLD',
}

const LABELS: Record<FeatureStatus, string> = {
  [FeatureStatus.BACKLOG]: 'Backlog',
  [FeatureStatus.PLANNED]: 'Planejada',
  [FeatureStatus.IN_PROGRESS]: 'Em Progresso',
  [FeatureStatus.BLOCKED]: 'Bloqueada',
  [FeatureStatus.DONE]: 'Concluída',
  [FeatureStatus.ON_HOLD]: 'Em Espera',
};

export class FeatureStatusVO {
  private constructor(private readonly value: FeatureStatus) {}

  static create(value: string): FeatureStatusVO {
    if (!Object.values(FeatureStatus).includes(value as FeatureStatus)) {
      throw new Error(`Status de feature inválido: ${value}`);
    }
    return new FeatureStatusVO(value as FeatureStatus);
  }

  static planned(): FeatureStatusVO {
    return new FeatureStatusVO(FeatureStatus.PLANNED);
  }

  static fromEnum(value: FeatureStatus): FeatureStatusVO {
    return new FeatureStatusVO(value);
  }

  getValue(): FeatureStatus {
    return this.value;
  }

  getLabel(): string {
    return LABELS[this.value];
  }

  isBlocked(): boolean {
    return this.value === FeatureStatus.BLOCKED;
  }

  isDone(): boolean {
    return this.value === FeatureStatus.DONE;
  }

  toString(): string {
    return this.value;
  }
}
