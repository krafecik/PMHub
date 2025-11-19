const STATUS_VALIDOS = ['RASCUNHO', 'REVISAO', 'APROVADO', 'OBSOLETO'] as const;

export type DocumentoStatusValue = (typeof STATUS_VALIDOS)[number];

export class DocumentoStatusVO {
  private readonly value: DocumentoStatusValue;

  constructor(value: string) {
    const upperValue = value.toUpperCase() as DocumentoStatusValue;

    if (!STATUS_VALIDOS.includes(upperValue)) {
      throw new Error(`Status de documento inválido: ${value}`);
    }

    this.value = upperValue;
  }

  getValue(): DocumentoStatusValue {
    return this.value;
  }

  equals(other: DocumentoStatusVO): boolean {
    return this.value === other.value;
  }
}
