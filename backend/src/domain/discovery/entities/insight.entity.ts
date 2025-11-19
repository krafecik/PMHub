import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import {
  InsightId,
  DiscoveryId,
  EntrevistaId,
  StatusInsightVO,
  StatusInsightEnum,
  ImpactoInsightVO,
  ConfiancaInsightVO,
} from '../value-objects';

interface InsightProps {
  id?: InsightId;
  tenantId: TenantId;
  discoveryId: DiscoveryId;
  entrevistaId?: EntrevistaId;
  descricao: string;
  impacto: ImpactoInsightVO;
  confianca: ConfiancaInsightVO;
  status: StatusInsightVO;
  tags: string[];
  evidenciasIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Insight {
  private readonly props: InsightProps;

  constructor(props: InsightProps) {
    this.validateProps(props);
    this.props = props;
  }

  private validateProps(props: InsightProps): void {
    if (!props.descricao || props.descricao.trim().length === 0) {
      throw new Error('Descrição é obrigatória');
    }
  }

  get id(): InsightId | undefined {
    return this.props.id;
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get discoveryId(): DiscoveryId {
    return this.props.discoveryId;
  }

  get entrevistaId(): EntrevistaId | undefined {
    return this.props.entrevistaId;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get impacto(): ImpactoInsightVO {
    return this.props.impacto;
  }

  get confianca(): ConfiancaInsightVO {
    return this.props.confianca;
  }

  get status(): StatusInsightVO {
    return this.props.status;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get evidenciasIds(): string[] {
    return this.props.evidenciasIds;
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
  isDraft(): boolean {
    return this.props.status.isDraft();
  }

  isFinal(): boolean {
    return this.props.status.isFinal();
  }

  isFromEntrevista(): boolean {
    return !!this.props.entrevistaId;
  }

  hasEvidencias(): boolean {
    return this.props.evidenciasIds.length > 0;
  }

  getRelevanceScore(): number {
    const impactScore = this.props.impacto.getScore();
    const confiancaScore = this.props.confianca.getScore();

    return (impactScore * confiancaScore) / 4;
  }

  updateDescricao(descricao: string): void {
    if (!descricao || descricao.trim().length === 0) {
      throw new Error('Descrição não pode ser vazia');
    }
    this.props.descricao = descricao;
  }

  updateImpacto(impacto: ImpactoInsightVO): void {
    this.props.impacto = impacto;
  }

  updateConfianca(confianca: ConfiancaInsightVO): void {
    this.props.confianca = confianca;
  }

  validar(statusValidado: StatusInsightVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Insight já está finalizado');
    }

    if (this.props.evidenciasIds.length === 0) {
      throw new Error('Insight precisa ter pelo menos uma evidência para ser validado');
    }

    statusValidado.ensureSlug(
      StatusInsightVO.enumToSlug(StatusInsightEnum.VALIDADO),
      'validar insight (novo status)',
    );

    this.props.status = statusValidado;
  }

  refutar(statusRefutado: StatusInsightVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Insight já está finalizado');
    }

    statusRefutado.ensureSlug(
      StatusInsightVO.enumToSlug(StatusInsightEnum.REFUTADO),
      'refutar insight (novo status)',
    );

    this.props.status = statusRefutado;
  }

  colocarEmAnalise(statusEmAnalise: StatusInsightVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Insight já está finalizado');
    }

    statusEmAnalise.ensureSlug(
      StatusInsightVO.enumToSlug(StatusInsightEnum.EM_ANALISE),
      'colocar insight em análise (novo status)',
    );

    this.props.status = statusEmAnalise;
  }

  voltarParaRascunho(statusRascunho: StatusInsightVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Insight finalizado não pode voltar para rascunho');
    }

    statusRascunho.ensureSlug(
      StatusInsightVO.enumToSlug(StatusInsightEnum.RASCUNHO),
      'voltar insight para rascunho (novo status)',
    );

    this.props.status = statusRascunho;
  }

  addEvidencia(evidenciaId: string): void {
    if (!evidenciaId || evidenciaId.trim().length === 0) {
      throw new Error('ID da evidência não pode ser vazio');
    }

    if (!this.props.evidenciasIds.includes(evidenciaId)) {
      this.props.evidenciasIds.push(evidenciaId);
    }
  }

  removeEvidencia(evidenciaId: string): void {
    this.props.evidenciasIds = this.props.evidenciasIds.filter((id) => id !== evidenciaId);
  }

  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new Error('Tag não pode ser vazia');
    }

    const normalizedTag = tag.trim().toLowerCase();
    if (!this.props.tags.includes(normalizedTag)) {
      this.props.tags.push(normalizedTag);
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    this.props.tags = this.props.tags.filter((t) => t !== normalizedTag);
  }

  linkToEntrevista(entrevistaId: EntrevistaId): void {
    this.props.entrevistaId = entrevistaId;
  }

  // Factory method
  static create(
    props: Omit<InsightProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
      tags?: string[];
      evidenciasIds?: string[];
    },
  ): Insight {
    props.status.ensureSlug(
      StatusInsightVO.enumToSlug(StatusInsightEnum.RASCUNHO),
      'criação de insight (status inicial)',
    );

    return new Insight({
      ...props,
      tags: props.tags || [],
      evidenciasIds: props.evidenciasIds || [],
    });
  }

  // Reconstitution from persistence
  static fromPersistence(props: InsightProps): Insight {
    return new Insight(props);
  }
}
