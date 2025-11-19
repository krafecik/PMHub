export interface DuplicataDetectadaEventProps {
  demandaId: string;
  demandaOriginalId: string;
  similaridade: number;
  marcadoPorId: string;
  timestamp: Date;
}

export class DuplicataDetectadaEvent {
  readonly demandaId: string;
  readonly demandaOriginalId: string;
  readonly similaridade: number;
  readonly marcadoPorId: string;
  readonly timestamp: Date;

  constructor(props: DuplicataDetectadaEventProps) {
    this.demandaId = props.demandaId;
    this.demandaOriginalId = props.demandaOriginalId;
    this.similaridade = props.similaridade;
    this.marcadoPorId = props.marcadoPorId;
    this.timestamp = props.timestamp;
  }

  getName(): string {
    return 'DuplicataDetectadaEvent';
  }
}
