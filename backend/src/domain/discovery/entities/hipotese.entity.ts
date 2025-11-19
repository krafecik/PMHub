import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import {
  HipoteseId,
  DiscoveryId,
  StatusHipoteseVO,
  StatusHipoteseEnum,
  ImpactoHipoteseVO,
  PrioridadeHipoteseVO,
} from '../value-objects';

interface HipoteseProps {
  id?: HipoteseId;
  tenantId: TenantId;
  discoveryId: DiscoveryId;
  titulo: string;
  descricao: string;
  comoValidar: string;
  metricaAlvo?: string;
  impactoEsperado: ImpactoHipoteseVO;
  prioridade: PrioridadeHipoteseVO;
  status: StatusHipoteseVO;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Hipotese {
  private readonly props: HipoteseProps;

  constructor(props: HipoteseProps) {
    this.props = props;
  }

  get id(): HipoteseId | undefined {
    return this.props.id;
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get discoveryId(): DiscoveryId {
    return this.props.discoveryId;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get comoValidar(): string {
    return this.props.comoValidar;
  }

  get metricaAlvo(): string | undefined {
    return this.props.metricaAlvo;
  }

  get impactoEsperado(): ImpactoHipoteseVO {
    return this.props.impactoEsperado;
  }

  get prioridade(): PrioridadeHipoteseVO {
    return this.props.prioridade;
  }

  get status(): StatusHipoteseVO {
    return this.props.status;
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

  // Domain Methods
  isActive(): boolean {
    return this.props.status.isActive();
  }

  isFinal(): boolean {
    return this.props.status.isFinal();
  }

  isSuccess(): boolean {
    return this.props.status.isSuccess();
  }

  updateTitulo(titulo: string): void {
    if (!titulo || titulo.trim().length === 0) {
      throw new Error('Título não pode ser vazio');
    }
    this.props.titulo = titulo;
  }

  updateDescricao(descricao: string): void {
    if (!descricao || descricao.trim().length === 0) {
      throw new Error('Descrição não pode ser vazia');
    }
    this.props.descricao = descricao;
  }

  updateComoValidar(comoValidar: string): void {
    if (!comoValidar || comoValidar.trim().length === 0) {
      throw new Error('Como validar não pode ser vazio');
    }
    this.props.comoValidar = comoValidar;
  }

  updateMetricaAlvo(metricaAlvo: string): void {
    this.props.metricaAlvo = metricaAlvo;
  }

  updateImpactoEsperado(impactoEsperado: ImpactoHipoteseVO): void {
    this.props.impactoEsperado = impactoEsperado;
  }

  updatePrioridade(prioridade: PrioridadeHipoteseVO): void {
    this.props.prioridade = prioridade;
  }

  iniciarTeste(novoStatus: StatusHipoteseVO): void {
    this.props.status.ensureSlug(
      StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.PENDENTE),
      'iniciar teste (status atual)',
    );
    novoStatus.ensureSlug(
      StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.EM_TESTE),
      'iniciar teste (novo status)',
    );

    this.props.status = novoStatus;
  }

  validar(novoStatus: StatusHipoteseVO): void {
    this.props.status.ensureSlug(
      StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.EM_TESTE),
      'validar hipótese (status atual)',
    );
    novoStatus.ensureSlug(
      StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.VALIDADA),
      'validar hipótese (novo status)',
    );

    this.props.status = novoStatus;
  }

  refutar(novoStatus: StatusHipoteseVO): void {
    if (!this.props.status.isActive()) {
      throw new Error('Hipótese precisa estar pendente para iniciar teste');
    }
    novoStatus.ensureSlug(
      StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.REFUTADA),
      'refutar hipótese (novo status)',
    );

    this.props.status = novoStatus;
  }

  arquivar(novoStatus: StatusHipoteseVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Hipótese já está finalizada');
    }
    novoStatus.ensureSlug(
      StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.ARQUIVADA),
      'arquivar hipótese (novo status)',
    );

    this.props.status = novoStatus;
  }

  // Factory method
  static create(
    props: Omit<HipoteseProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Hipotese {
    const expectedSlug = StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.PENDENTE);
    props.status.ensureSlug(expectedSlug, 'criação de hipótese (status inicial)');

    return new Hipotese({
      ...props,
    });
  }

  // Reconstitution from persistence
  static fromPersistence(props: HipoteseProps): Hipotese {
    return new Hipotese(props);
  }
}
