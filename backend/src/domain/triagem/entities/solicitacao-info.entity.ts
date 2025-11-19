export enum StatusSolicitacaoEnum {
  PENDENTE = 'PENDENTE',
  RESPONDIDO = 'RESPONDIDO',
  EXPIRADO = 'EXPIRADO',
}

export interface SolicitacaoInfoProps {
  id: string;
  triagemId: string;
  solicitanteId: string;
  texto: string;
  anexos: string[];
  prazo?: Date;
  status: StatusSolicitacaoEnum;
  respondidoEm?: Date;
  resposta?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SolicitacaoInfo {
  private readonly props: SolicitacaoInfoProps;

  constructor(props: SolicitacaoInfoProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get triagemId(): string {
    return this.props.triagemId;
  }

  get solicitanteId(): string {
    return this.props.solicitanteId;
  }

  get texto(): string {
    return this.props.texto;
  }

  get anexos(): string[] {
    return this.props.anexos;
  }

  get prazo(): Date | undefined {
    return this.props.prazo;
  }

  get status(): StatusSolicitacaoEnum {
    return this.props.status;
  }

  get respondidoEm(): Date | undefined {
    return this.props.respondidoEm;
  }

  get resposta(): string | undefined {
    return this.props.resposta;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic
  isPendente(): boolean {
    return this.props.status === StatusSolicitacaoEnum.PENDENTE;
  }

  isExpirada(): boolean {
    if (this.props.status !== StatusSolicitacaoEnum.PENDENTE || !this.props.prazo) {
      return false;
    }
    return new Date() > this.props.prazo;
  }

  diasAguardando(): number {
    const agora = new Date();
    const diff = agora.getTime() - this.props.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  responder(resposta: string): void {
    if (this.props.status !== StatusSolicitacaoEnum.PENDENTE) {
      throw new Error('Solicitação já foi respondida ou expirou');
    }

    this.props.resposta = resposta;
    this.props.respondidoEm = new Date();
    this.props.status = StatusSolicitacaoEnum.RESPONDIDO;
    this.props.updatedAt = new Date();
  }

  expirar(): void {
    if (this.props.status !== StatusSolicitacaoEnum.PENDENTE) {
      throw new Error('Solicitação já foi respondida ou expirou');
    }

    this.props.status = StatusSolicitacaoEnum.EXPIRADO;
    this.props.updatedAt = new Date();
  }

  adicionarAnexo(anexoUrl: string): void {
    this.props.anexos.push(anexoUrl);
    this.props.updatedAt = new Date();
  }

  static criar(
    triagemId: string,
    solicitanteId: string,
    texto: string,
    prazo?: Date,
  ): SolicitacaoInfo {
    return new SolicitacaoInfo({
      id: '', // Will be set by repository
      triagemId,
      solicitanteId,
      texto,
      anexos: [],
      prazo,
      status: StatusSolicitacaoEnum.PENDENTE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
