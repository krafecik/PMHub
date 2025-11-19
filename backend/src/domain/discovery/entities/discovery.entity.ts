import { DemandaId } from '../../demandas/value-objects';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';
import { ProductId } from '../../shared/value-objects/product-id.vo';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { DiscoveryId, StatusDiscoveryVO, SeveridadeProblemaVO } from '../value-objects';

type DiscoveryEvolucaoEntry = {
  tipo: string;
  dados: Record<string, unknown>;
  timestamp: Date;
};

interface DiscoveryProps {
  id?: DiscoveryId;
  tenantId: TenantId;
  demandaId: DemandaId;
  titulo: string;
  descricao: string;
  contexto?: string;
  publicoAfetado: string[];
  volumeImpactado?: string;
  severidade: SeveridadeProblemaVO;
  comoIdentificado: string[];
  status: StatusDiscoveryVO;
  criadoPorId: UserId;
  responsavelId: UserId;
  produtoId: ProductId;
  evolucaoLog?: DiscoveryEvolucaoEntry[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  decisaoParcial?: CatalogItemVO;
  produtoNome?: string;
  responsavelNome?: string;
  criadoPorNome?: string;
}

export class Discovery {
  private readonly props: DiscoveryProps;

  constructor(props: DiscoveryProps) {
    this.props = props;
  }

  get id(): DiscoveryId | undefined {
    return this.props.id;
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get demandaId(): DemandaId {
    return this.props.demandaId;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get contexto(): string | undefined {
    return this.props.contexto;
  }

  get publicoAfetado(): string[] {
    return this.props.publicoAfetado;
  }

  get volumeImpactado(): string | undefined {
    return this.props.volumeImpactado;
  }

  get severidade(): SeveridadeProblemaVO {
    return this.props.severidade;
  }

  get comoIdentificado(): string[] {
    return this.props.comoIdentificado;
  }

  get status(): StatusDiscoveryVO {
    return this.props.status;
  }

  get criadoPorId(): UserId {
    return this.props.criadoPorId;
  }

  get responsavelId(): UserId {
    return this.props.responsavelId;
  }

  get produtoId(): ProductId {
    return this.props.produtoId;
  }

  get evolucaoLog(): DiscoveryEvolucaoEntry[] {
    return this.props.evolucaoLog || [];
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

  get decisaoParcial(): CatalogItemVO | undefined {
    return this.props.decisaoParcial;
  }

  get produtoNome(): string | undefined {
    return this.props.produtoNome;
  }

  get responsavelNome(): string | undefined {
    return this.props.responsavelNome;
  }

  get criadoPorNome(): string | undefined {
    return this.props.criadoPorNome;
  }

  // Domain Methods
  isActive(): boolean {
    return this.props.status.isActive();
  }

  isFinal(): boolean {
    return this.props.status.isFinal();
  }

  updateTitulo(titulo: string): void {
    if (!titulo || titulo.trim().length === 0) {
      throw new Error('Título não pode ser vazio');
    }
    this.props.titulo = titulo;
    this.addEvolucaoEntry('titulo_atualizado', { titulo });
  }

  updateDescricao(descricao: string): void {
    if (!descricao || descricao.trim().length === 0) {
      throw new Error('Descrição não pode ser vazia');
    }
    this.props.descricao = descricao;
    this.addEvolucaoEntry('descricao_atualizada', { descricao });
  }

  updateContexto(contexto: string): void {
    this.props.contexto = contexto;
    this.addEvolucaoEntry('contexto_atualizado', { contexto });
  }

  updatePublicoAfetado(publicoAfetado: string[]): void {
    this.props.publicoAfetado = publicoAfetado;
    this.addEvolucaoEntry('publico_afetado_atualizado', { publicoAfetado });
  }

  updateComoIdentificado(comoIdentificado: string[]): void {
    this.props.comoIdentificado = comoIdentificado;
    this.addEvolucaoEntry('origem_identificacao_atualizada', { comoIdentificado });
  }

  updateVolumeImpactado(volumeImpactado: string): void {
    this.props.volumeImpactado = volumeImpactado;
    this.addEvolucaoEntry('volume_impactado_atualizado', { volumeImpactado });
  }

  updateSeveridade(severidade: SeveridadeProblemaVO): void {
    this.props.severidade = severidade;
    this.addEvolucaoEntry('severidade_atualizada', {
      severidadeSlug: severidade.getSlug(),
      severidadeLabel: severidade.getLabel(),
      impacto: severidade.getImpacto().getLabel(),
    });
  }

  updateStatus(newStatus: StatusDiscoveryVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Não é possível alterar o status de um discovery finalizado');
    }

    this.props.status = newStatus;
    this.addEvolucaoEntry('status_atualizado', {
      statusSlug: newStatus.getSlug(),
      statusLabel: newStatus.getLabel(),
    });
  }

  finalizarComDecisao(statusFinal: StatusDiscoveryVO): void {
    if (this.props.status.isFinal()) {
      throw new Error('Discovery já está finalizado');
    }

    if (!statusFinal.isFinal()) {
      throw new Error('Status final inválido');
    }

    this.props.status = statusFinal;
    this.addEvolucaoEntry('discovery_finalizado', {
      statusSlug: statusFinal.getSlug(),
      statusLabel: statusFinal.getLabel(),
    });
  }

  changeResponsavel(novoResponsavelId: UserId): void {
    this.props.responsavelId = novoResponsavelId;
    this.addEvolucaoEntry('responsavel_alterado', {
      responsavelId: novoResponsavelId.getValue(),
    });
  }

  setDecisaoParcial(item: CatalogItemVO | undefined): void {
    this.props.decisaoParcial = item;
    this.addEvolucaoEntry('decisao_parcial_atualizada', {
      decisaoParcialSlug: item?.slug ?? null,
      decisaoParcialLabel: item?.label ?? null,
    });
  }

  registerActivity(tipo: string, dados: Record<string, unknown>): void {
    this.addEvolucaoEntry(tipo, dados);
  }

  private addEvolucaoEntry(tipo: string, dados: Record<string, unknown>): void {
    if (!this.props.evolucaoLog) {
      this.props.evolucaoLog = [];
    }

    this.props.evolucaoLog.push({
      tipo,
      dados,
      timestamp: new Date(),
    });
  }

  // Factory method
  static create(
    props: Omit<DiscoveryProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'evolucaoLog'>,
  ): Discovery {
    return new Discovery({
      ...props,
      evolucaoLog: [],
    });
  }

  // Reconstitution from persistence
  static fromPersistence(props: DiscoveryProps): Discovery {
    return new Discovery(props);
  }
}
