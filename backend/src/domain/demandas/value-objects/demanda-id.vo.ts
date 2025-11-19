export class DemandaId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('DemandaId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DemandaId): boolean {
    return this.value === other.value;
  }
}
