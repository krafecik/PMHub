import { EpicoStatusVO, EpicoHealthVO, QuarterVO } from '../value-objects';

export interface EpicoProps {
  id?: string;
  tenantId: string;
  produtoId: string;
  planningCycleId?: string | null;
  titulo: string;
  descricao?: string;
  objetivo?: string;
  valueProposition?: string;
  criteriosAceite?: string;
  riscos?: string;
  status: EpicoStatusVO;
  health: EpicoHealthVO;
  quarter: QuarterVO;
  squadId?: string;
  ownerId: string;
  sponsorId?: string;
  progressPercent?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Epico {
  private props: EpicoProps;

  private constructor(props: EpicoProps) {
    this.props = props;
  }

  static create(
    props: Omit<
      EpicoProps,
      'id' | 'status' | 'health' | 'progressPercent' | 'createdAt' | 'updatedAt' | 'deletedAt'
    > & { status?: EpicoStatusVO; health?: EpicoHealthVO },
  ): Epico {
    return new Epico({
      ...props,
      status: props.status ?? EpicoStatusVO.planned(),
      health: props.health ?? EpicoHealthVO.green(),
      progressPercent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: EpicoProps): Epico {
    return new Epico(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get status(): EpicoStatusVO {
    return this.props.status;
  }

  get health(): EpicoHealthVO {
    return this.props.health;
  }

  get quarter(): QuarterVO {
    return this.props.quarter;
  }

  get squadId(): string | undefined {
    return this.props.squadId;
  }

  toObject(): EpicoProps {
    return { ...this.props };
  }

  atualizarStatus(novoStatus: EpicoStatusVO): void {
    if (!this.props.status.canTransitionTo(novoStatus)) {
      throw new Error(
        `Transição de status inválida de ${this.props.status.getLabel()} para ${novoStatus.getLabel()}`,
      );
    }
    this.props.status = novoStatus;
    this.touch();
  }

  atualizarHealth(novoHealth: EpicoHealthVO): void {
    this.props.health = novoHealth;
    this.touch();
  }

  atualizarDescricao(descricao?: string): void {
    this.props.descricao = descricao;
    this.touch();
  }

  atualizarObjetivo(objetivo?: string, valueProposition?: string): void {
    this.props.objetivo = objetivo;
    this.props.valueProposition = valueProposition;
    this.touch();
  }

  definirCriteriosERiscos(criterios?: string, riscos?: string): void {
    this.props.criteriosAceite = criterios;
    this.props.riscos = riscos;
    this.touch();
  }

  atribuirSquad(squadId?: string): void {
    this.props.squadId = squadId;
    this.touch();
  }

  definirDatas(startDate?: Date | null, endDate?: Date | null): void {
    this.props.startDate = startDate ?? null;
    this.props.endDate = endDate ?? null;
    this.touch();
  }

  atualizarProgresso(percent: number): void {
    if (percent < 0 || percent > 100) {
      throw new Error('Percentual de progresso inválido');
    }
    this.props.progressPercent = percent;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
