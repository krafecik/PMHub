export interface DuplicatasDemandaProps {
  id: string;
  demandaId: string;
  demandaOriginalId: string;
  similaridade: number;
  createdAt: Date;
}

export class DuplicatasDemanda {
  private readonly props: DuplicatasDemandaProps;

  constructor(props: DuplicatasDemandaProps) {
    if (props.similaridade < 0 || props.similaridade > 100) {
      throw new Error('Similaridade deve estar entre 0 e 100');
    }
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get demandaId(): string {
    return this.props.demandaId;
  }

  get demandaOriginalId(): string {
    return this.props.demandaOriginalId;
  }

  get similaridade(): number {
    return this.props.similaridade;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business logic
  isAltaSimilaridade(): boolean {
    return this.props.similaridade >= 80;
  }

  isMediaSimilaridade(): boolean {
    return this.props.similaridade >= 50 && this.props.similaridade < 80;
  }

  isBaixaSimilaridade(): boolean {
    return this.props.similaridade < 50;
  }

  static criar(
    demandaId: string,
    demandaOriginalId: string,
    similaridade: number,
  ): DuplicatasDemanda {
    return new DuplicatasDemanda({
      id: '', // Will be set by repository
      demandaId,
      demandaOriginalId,
      similaridade,
      createdAt: new Date(),
    });
  }
}
