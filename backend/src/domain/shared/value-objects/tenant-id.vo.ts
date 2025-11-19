export class TenantId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}
