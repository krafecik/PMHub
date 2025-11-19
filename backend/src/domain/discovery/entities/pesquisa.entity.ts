import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import {
  PesquisaId,
  DiscoveryId,
  MetodoPesquisaVO,
  StatusPesquisaVO,
  StatusPesquisaEnum,
} from '../value-objects';

interface PesquisaProps {
  id?: PesquisaId;
  tenantId: TenantId;
  discoveryId: DiscoveryId;
  titulo: string;
  metodo: MetodoPesquisaVO;
  objetivo: string;
  roteiroUrl?: string;
  status: StatusPesquisaVO;
  totalParticipantes: number;
  participantesConcluidos: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Pesquisa {
  private readonly props: PesquisaProps;

  constructor(props: PesquisaProps) {
    this.props = props;
  }

  get id(): PesquisaId | undefined {
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

  get metodo(): MetodoPesquisaVO {
    return this.props.metodo;
  }

  get objetivo(): string {
    return this.props.objetivo;
  }

  get roteiroUrl(): string | undefined {
    return this.props.roteiroUrl;
  }

  get status(): StatusPesquisaVO {
    return this.props.status;
  }

  get totalParticipantes(): number {
    return this.props.totalParticipantes;
  }

  get participantesConcluidos(): number {
    return this.props.participantesConcluidos;
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

  canAddEntrevista(): boolean {
    return this.props.status.canAddEntrevista();
  }

  getProgressoPercentual(): number {
    if (this.props.totalParticipantes === 0) {
      return 0;
    }
    return Math.round((this.props.participantesConcluidos / this.props.totalParticipantes) * 100);
  }

  updateTitulo(titulo: string): void {
    if (!titulo || titulo.trim().length === 0) {
      throw new Error('Título não pode ser vazio');
    }
    this.props.titulo = titulo;
  }

  updateObjetivo(objetivo: string): void {
    if (!objetivo || objetivo.trim().length === 0) {
      throw new Error('Objetivo não pode ser vazio');
    }
    this.props.objetivo = objetivo;
  }

  updateRoteiroUrl(roteiroUrl: string): void {
    this.props.roteiroUrl = roteiroUrl;
  }

  updateTotalParticipantes(total: number): void {
    if (total < 0) {
      throw new Error('Total de participantes não pode ser negativo');
    }

    if (total < this.props.participantesConcluidos) {
      throw new Error('Total de participantes não pode ser menor que participantes concluídos');
    }

    this.props.totalParticipantes = total;
  }

  iniciar(statusEmAndamento: StatusPesquisaVO): void {
    this.props.status.ensureSlug(
      StatusPesquisaVO.enumToSlug(StatusPesquisaEnum.PLANEJADA),
      'iniciar pesquisa (status atual)',
    );

    if (this.props.totalParticipantes === 0) {
      throw new Error('Defina o total de participantes antes de iniciar a pesquisa');
    }

    statusEmAndamento.ensureSlug(
      StatusPesquisaVO.enumToSlug(StatusPesquisaEnum.EM_ANDAMENTO),
      'iniciar pesquisa (novo status)',
    );

    this.props.status = statusEmAndamento;
  }

  incrementarParticipanteConcluido(): boolean {
    if (!this.canAddEntrevista()) {
      throw new Error('Pesquisa precisa estar em andamento para adicionar entrevista');
    }

    if (this.props.participantesConcluidos >= this.props.totalParticipantes) {
      throw new Error('Número de participantes concluídos já atingiu o total');
    }

    this.props.participantesConcluidos++;

    return this.props.participantesConcluidos === this.props.totalParticipantes;
  }

  concluir(statusConcluida: StatusPesquisaVO): void {
    this.props.status.ensureSlug(
      StatusPesquisaVO.enumToSlug(StatusPesquisaEnum.EM_ANDAMENTO),
      'concluir pesquisa (status atual)',
    );

    statusConcluida.ensureSlug(
      StatusPesquisaVO.enumToSlug(StatusPesquisaEnum.CONCLUIDA),
      'concluir pesquisa (novo status)',
    );

    this.props.status = statusConcluida;
  }

  cancelar(statusCancelada: StatusPesquisaVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Pesquisa já está finalizada');
    }

    statusCancelada.ensureSlug(
      StatusPesquisaVO.enumToSlug(StatusPesquisaEnum.CANCELADA),
      'cancelar pesquisa (novo status)',
    );

    this.props.status = statusCancelada;
  }

  // Factory method
  static create(
    props: Omit<
      PesquisaProps,
      'id' | 'participantesConcluidos' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): Pesquisa {
    props.status.ensureSlug(
      StatusPesquisaVO.enumToSlug(StatusPesquisaEnum.PLANEJADA),
      'criação de pesquisa (status inicial)',
    );

    return new Pesquisa({
      ...props,
      participantesConcluidos: 0,
    });
  }

  // Reconstitution from persistence
  static fromPersistence(props: PesquisaProps): Pesquisa {
    return new Pesquisa(props);
  }
}
