const TIPOS_VALIDOS = ['PRD', 'BRD', 'RFC', 'SPEC', 'RELEASE_NOTE', 'UX_DOC'] as const;

export type DocumentoTipoValue = (typeof TIPOS_VALIDOS)[number];

export class DocumentoTipoVO {
  private readonly value: DocumentoTipoValue;

  constructor(value: string) {
    const upperValue = value.toUpperCase() as DocumentoTipoValue;

    if (!TIPOS_VALIDOS.includes(upperValue)) {
      throw new Error(`Tipo de documento inválido: ${value}`);
    }

    this.value = upperValue;
  }

  getValue(): DocumentoTipoValue {
    return this.value;
  }

  equals(other: DocumentoTipoVO): boolean {
    return this.value === other.value;
  }
}
