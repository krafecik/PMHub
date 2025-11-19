export class DiscoveryId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('DiscoveryId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DiscoveryId): boolean {
    return this.value === other.value;
  }
}
