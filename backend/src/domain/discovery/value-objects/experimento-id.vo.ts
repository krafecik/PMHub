export class ExperimentoId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ExperimentoId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ExperimentoId): boolean {
    return this.value === other.value;
  }
}
