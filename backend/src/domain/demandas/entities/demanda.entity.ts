import {
  TipoDemandaVO,
  OrigemDemandaVO,
  PrioridadeVO,
  StatusDemandaVO,
  TituloVO,
} from '../value-objects';

export interface DemandaProps {
  id?: string;
  tenantId: string;
  titulo: TituloVO;
  descricao?: string;
  tipo: TipoDemandaVO;
  produtoId: string;
  origem: OrigemDemandaVO;
  origemDetalhe?: string;
  responsavelId?: string;
  prioridade: PrioridadeVO;
  status: StatusDemandaVO;
  criadoPorId: string;
  motivoCancelamento?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Demanda {
  private props: DemandaProps;

  private constructor(props: DemandaProps) {
    this.props = props;
  }

  static create(props: Omit<DemandaProps, 'createdAt' | 'updatedAt'>): Demanda {
    return new Demanda({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: DemandaProps): Demanda {
    return new Demanda(props);
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get titulo(): TituloVO {
    return this.props.titulo;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get tipo(): TipoDemandaVO {
    return this.props.tipo;
  }

  get produtoId(): string {
    return this.props.produtoId;
  }

  get origem(): OrigemDemandaVO {
    return this.props.origem;
  }

  get origemDetalhe(): string | undefined {
    return this.props.origemDetalhe;
  }

  get responsavelId(): string | undefined {
    return this.props.responsavelId;
  }

  get prioridade(): PrioridadeVO {
    return this.props.prioridade;
  }

  get status(): StatusDemandaVO {
    return this.props.status;
  }

  get criadoPorId(): string {
    return this.props.criadoPorId;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get motivoCancelamento(): string | undefined {
    return this.props.motivoCancelamento;
  }

  // Business methods
  atualizarTitulo(titulo: TituloVO): void {
    if (!this.props.status.isEditable()) {
      throw new Error('Demanda não pode ser editada neste status');
    }
    this.props.titulo = titulo;
    this.touch();
  }

  atualizarDescricao(descricao: string): void {
    if (!this.props.status.isEditable()) {
      throw new Error('Demanda não pode ser editada neste status');
    }
    this.props.descricao = descricao;
    this.touch();
  }

  alterarPrioridade(prioridade: PrioridadeVO): void {
    this.props.prioridade = prioridade;
    this.touch();
  }

  alterarTipo(tipo: TipoDemandaVO): void {
    this.props.tipo = tipo;
    this.touch();
  }

  alterarOrigem(origem: OrigemDemandaVO, detalhe?: string): void {
    this.props.origem = origem;
    this.props.origemDetalhe = detalhe ?? this.props.origemDetalhe;
    this.touch();
  }

  atribuirResponsavel(responsavelId: string): void {
    this.props.responsavelId = responsavelId;
    this.touch();
  }

  removerResponsavel(): void {
    this.props.responsavelId = undefined;
    this.touch();
  }

  alterarStatus(novoStatus: StatusDemandaVO): void {
    if (!this.props.status.canTransitionTo(novoStatus)) {
      throw new Error(
        `Não é possível transicionar de ${this.props.status.label} para ${novoStatus.label}`,
      );
    }
    this.props.status = novoStatus;
    this.touch();
  }

  arquivar(statusArquivado: StatusDemandaVO): void {
    this.alterarStatus(statusArquivado);
  }

  marcarParaTriagem(statusTriagem: StatusDemandaVO): void {
    this.alterarStatus(statusTriagem);
  }

  cancelar(statusCancelado: StatusDemandaVO, motivoCancelamento: string): void {
    if (!motivoCancelamento || motivoCancelamento.trim().length === 0) {
      throw new Error('Motivo do cancelamento é obrigatório');
    }
    this.alterarStatus(statusCancelado);
    this.props.motivoCancelamento = motivoCancelamento.trim();
    this.touch();
  }

  isActive(): boolean {
    return this.props.status.isActive() && !this.props.deletedAt;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = null;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toObject(): DemandaProps {
    return { ...this.props };
  }
}
