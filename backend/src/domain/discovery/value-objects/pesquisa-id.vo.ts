export class PesquisaId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('PesquisaId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PesquisaId): boolean {
    return this.value === other.value;
  }
}
