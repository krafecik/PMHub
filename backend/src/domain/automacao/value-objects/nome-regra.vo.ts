export class NomeRegra {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Nome da regra não pode ser vazio');
    }

    if (value.length < 3) {
      throw new Error('Nome da regra deve ter pelo menos 3 caracteres');
    }

    if (value.length > 100) {
      throw new Error('Nome da regra não pode ter mais de 100 caracteres');
    }

    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  getValue(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: NomeRegra): boolean {
    return this._value === other._value;
  }
}
