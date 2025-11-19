import { Identifier } from '@core/domain/identifier';
import { randomUUID } from 'crypto';

export class DocumentoId extends Identifier<string> {
  constructor(value?: string) {
    super(value);
  }

  protected generate(): string {
    return randomUUID();
  }
}
