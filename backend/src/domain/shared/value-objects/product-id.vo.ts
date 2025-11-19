export class ProductId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ProductId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProductId): boolean {
    return this.value === other.value;
  }
}
