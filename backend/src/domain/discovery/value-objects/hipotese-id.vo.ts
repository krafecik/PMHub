export class HipoteseId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('HipoteseId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: HipoteseId): boolean {
    return this.value === other.value;
  }
}
