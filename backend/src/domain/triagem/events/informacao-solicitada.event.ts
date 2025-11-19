export interface InformacaoSolicitadaEventProps {
  tenantId: string;
  demandaId: string;
  triagemId: string;
  solicitacaoId: string;
  solicitanteId: string;
  texto: string;
  prazo?: Date;
  timestamp: Date;
}

export class InformacaoSolicitadaEvent {
  readonly demandaId: string;
  readonly triagemId: string;
  readonly solicitacaoId: string;
  readonly solicitanteId: string;
  readonly texto: string;
  readonly prazo?: Date;
  readonly timestamp: Date;
  readonly tenantId: string;

  constructor(props: InformacaoSolicitadaEventProps) {
    this.tenantId = props.tenantId;
    this.demandaId = props.demandaId;
    this.triagemId = props.triagemId;
    this.solicitacaoId = props.solicitacaoId;
    this.solicitanteId = props.solicitanteId;
    this.texto = props.texto;
    this.prazo = props.prazo;
    this.timestamp = props.timestamp;
  }

  getName(): string {
    return 'InformacaoSolicitadaEvent';
  }
}
