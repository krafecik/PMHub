export interface DemandaTriadaEventProps {
  demandaId: string;
  triagemId: string;
  statusAnterior: string;
  statusNovo: string;
  triadoPorId: string;
  timestamp: Date;
}

export class DemandaTriadaEvent {
  readonly demandaId: string;
  readonly triagemId: string;
  readonly statusAnterior: string;
  readonly statusNovo: string;
  readonly triadoPorId: string;
  readonly timestamp: Date;

  constructor(props: DemandaTriadaEventProps) {
    this.demandaId = props.demandaId;
    this.triagemId = props.triagemId;
    this.statusAnterior = props.statusAnterior;
    this.statusNovo = props.statusNovo;
    this.triadoPorId = props.triadoPorId;
    this.timestamp = props.timestamp;
  }

  getName(): string {
    return 'DemandaTriadaEvent';
  }
}
