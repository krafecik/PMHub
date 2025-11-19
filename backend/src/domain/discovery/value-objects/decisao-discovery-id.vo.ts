export class DecisaoDiscoveryId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('DecisaoDiscoveryId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DecisaoDiscoveryId): boolean {
    return this.value === other.value;
  }
}
