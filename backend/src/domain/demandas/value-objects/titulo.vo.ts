export class TituloVO {
  private static readonly MIN_LENGTH = 5;
  private static readonly MAX_LENGTH = 255;

  private constructor(private readonly value: string) {}

  static create(value: string): TituloVO {
    if (!value) {
      throw new Error('Título é obrigatório');
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < TituloVO.MIN_LENGTH) {
      throw new Error(
        `Título deve ter no mínimo ${TituloVO.MIN_LENGTH} caracteres`
      );
    }

    if (trimmedValue.length > TituloVO.MAX_LENGTH) {
      throw new Error(
        `Título deve ter no máximo ${TituloVO.MAX_LENGTH} caracteres`
      );
    }

    return new TituloVO(trimmedValue);
  }

  getValue(): string {
    return this.value;
  }

  length(): number {
    return this.value.length;
  }

  contains(searchTerm: string): boolean {
    return this.value.toLowerCase().includes(searchTerm.toLowerCase());
  }

  equals(other: TituloVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
