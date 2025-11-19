export class InsightId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('InsightId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InsightId): boolean {
    return this.value === other.value;
  }
}
