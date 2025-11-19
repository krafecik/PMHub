export class VersaoVO {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Versão não pode ser vazia');
    }

    if (!/^(\d+)(\.\d+)*$/.test(value)) {
      throw new Error('Versão deve seguir o padrão semântico (ex: 1.0, 1.2.3)');
    }

    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: VersaoVO): boolean {
    return this.value === other.value;
  }
}
