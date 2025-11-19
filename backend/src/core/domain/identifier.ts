export abstract class Identifier<T = string> {
  protected readonly _value: T;

  constructor(value?: T) {
    this._value = value || (this.generate() as T);
  }

  equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof this.constructor)) {
      return false;
    }
    return id.toValue() === this._value;
  }

  toString(): string {
    return String(this._value);
  }

  toValue(): T {
    return this._value;
  }

  protected abstract generate(): T;
}
