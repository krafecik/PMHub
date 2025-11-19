import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import {
  ExperimentoId,
  DiscoveryId,
  HipoteseId,
  StatusExperimentoVO,
  StatusExperimentoEnum,
  TipoExperimentoVO,
  MetricaSucessoExperimentoVO,
} from '../value-objects';

interface ExperimentoProps {
  id?: ExperimentoId;
  tenantId: TenantId;
  discoveryId: DiscoveryId;
  hipoteseId?: HipoteseId;
  titulo: string;
  descricao: string;
  tipo: TipoExperimentoVO;
  metricaSucesso: string;
  metricaSucessoCatalogo?: MetricaSucessoExperimentoVO;
  grupoControle?: unknown;
  grupoVariante?: unknown;
  resultados?: unknown;
  pValue?: number;
  status: StatusExperimentoVO;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Experimento {
  private readonly props: ExperimentoProps;

  constructor(props: ExperimentoProps) {
    this.validateProps(props);
    this.props = props;
  }

  private validateProps(props: ExperimentoProps): void {
    if (!props.titulo || props.titulo.trim().length === 0) {
      throw new Error('Título é obrigatório');
    }

    if (!props.descricao || props.descricao.trim().length === 0) {
      throw new Error('Descrição é obrigatória');
    }

    if (!props.metricaSucesso || props.metricaSucesso.trim().length === 0) {
      throw new Error('Métrica de sucesso é obrigatória');
    }
  }

  get id(): ExperimentoId | undefined {
    return this.props.id;
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get discoveryId(): DiscoveryId {
    return this.props.discoveryId;
  }

  get hipoteseId(): HipoteseId | undefined {
    return this.props.hipoteseId;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get tipo(): TipoExperimentoVO {
    return this.props.tipo;
  }

  get tipoSlug(): string {
    return this.props.tipo.getSlug();
  }

  get tipoLabel(): string {
    return this.props.tipo.getLabel();
  }

  get metricaSucesso(): string {
    return this.props.metricaSucesso;
  }

  get metricaSucessoCatalogo(): MetricaSucessoExperimentoVO | undefined {
    return this.props.metricaSucessoCatalogo;
  }

  get grupoControle(): unknown {
    return this.props.grupoControle;
  }

  get grupoVariante(): unknown {
    return this.props.grupoVariante;
  }

  get resultados(): unknown {
    return this.props.resultados;
  }

  get pValue(): number | undefined {
    return this.props.pValue;
  }

  get status(): StatusExperimentoVO {
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

  canStart(): boolean {
    return this.props.status.canStartExecution();
  }

  canFinish(): boolean {
    return this.props.status.canFinish();
  }

  isLinkedToHipotese(): boolean {
    return !!this.props.hipoteseId;
  }

  hasResults(): boolean {
    return !!this.props.resultados;
  }

  isStatisticallySignificant(threshold: number = 0.05): boolean {
    return this.props.pValue !== undefined && this.props.pValue < threshold;
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

  updateMetricaSucesso(
    metricaSucesso: string,
    metricaCatalogo?: MetricaSucessoExperimentoVO,
  ): void {
    if (!metricaSucesso || metricaSucesso.trim().length === 0) {
      throw new Error('Métrica de sucesso não pode ser vazia');
    }
    this.props.metricaSucesso = metricaSucesso;
    this.props.metricaSucessoCatalogo = metricaCatalogo;
  }

  linkToHipotese(hipoteseId: HipoteseId): void {
    if (this.props.status.isActive() || this.props.status.isFinal()) {
      throw new Error('Não é possível alterar hipótese de experimento em execução ou finalizado');
    }
    this.props.hipoteseId = hipoteseId;
  }

  configurarGrupos(grupoControle: unknown, grupoVariante: unknown): void {
    if (this.props.status.isActive() || this.props.status.isFinal()) {
      throw new Error('Não é possível alterar grupos de experimento em execução ou finalizado');
    }

    this.props.grupoControle = grupoControle;
    this.props.grupoVariante = grupoVariante;
  }

  iniciar(statusExecucao: StatusExperimentoVO): void {
    if (!this.canStart()) {
      throw new Error('Experimento não pode ser iniciado');
    }

    if (this.props.grupoControle == null || this.props.grupoVariante == null) {
      throw new Error('Configure os grupos antes de iniciar o experimento');
    }

    statusExecucao.ensureSlug(
      StatusExperimentoVO.enumToSlug(StatusExperimentoEnum.EM_EXECUCAO),
      'iniciar experimento (novo status)',
    );

    this.props.status = statusExecucao;
  }

  registrarResultados(resultados: unknown, pValue?: number): void {
    if (!this.props.status.isActive()) {
      throw new Error('Experimento precisa estar em execução para registrar resultados');
    }

    this.props.resultados = resultados;
    if (pValue !== undefined) {
      this.props.pValue = pValue;
    }
  }

  concluir(statusConcluido: StatusExperimentoVO): void {
    if (!this.canFinish()) {
      throw new Error('Experimento não pode ser concluído');
    }

    if (!this.hasResults()) {
      throw new Error('Registre os resultados antes de concluir o experimento');
    }

    statusConcluido.ensureSlug(
      StatusExperimentoVO.enumToSlug(StatusExperimentoEnum.CONCLUIDO),
      'concluir experimento (novo status)',
    );

    this.props.status = statusConcluido;
  }

  cancelar(
    statusCancelado: StatusExperimentoVO,
    motivoCancelamento = 'Cancelado pelo usuário',
  ): void {
    if (this.props.status.isFinal()) {
      throw new Error('Experimento já está finalizado');
    }

    statusCancelado.ensureSlug(
      StatusExperimentoVO.enumToSlug(StatusExperimentoEnum.CANCELADO),
      'cancelar experimento (novo status)',
    );

    this.props.status = statusCancelado;
    this.props.resultados = { cancelado: true, motivoCancelamento };
  }

  // Factory method
  static create(
    props: Omit<ExperimentoProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Experimento {
    props.status.ensureSlug(
      StatusExperimentoVO.enumToSlug(StatusExperimentoEnum.PLANEJADO),
      'criação de experimento (status inicial)',
    );

    return new Experimento(props);
  }

  // Reconstitution from persistence
  static fromPersistence(props: ExperimentoProps): Experimento {
    return new Experimento(props);
  }
}
