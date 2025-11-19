const QUARTER_REGEX = /^Q[1-4]\s20\d{2}$/;

export class QuarterVO {
  private constructor(private readonly value: string) {}

  static create(value: string): QuarterVO {
    if (!QUARTER_REGEX.test(value.trim())) {
      throw new Error(`Quarter inválido: ${value}. Utilize o formato Q1 2026.`);
    }

    return new QuarterVO(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  getYear(): number {
    return Number(this.value.split(' ')[1]);
  }

  getQuarterNumber(): number {
    return Number(this.value.replace('Q', '').split(' ')[0]);
  }

  toString(): string {
    return this.value;
  }
}
