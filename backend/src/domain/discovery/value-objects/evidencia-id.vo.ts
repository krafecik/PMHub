export class EvidenciaId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('EvidenciaId não pode ser vazio');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EvidenciaId): boolean {
    return this.value === other.value;
  }
}
