export class EntrevistaId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('EntrevistaId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EntrevistaId): boolean {
    return this.value === other.value;
  }
}
