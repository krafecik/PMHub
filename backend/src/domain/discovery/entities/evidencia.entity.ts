import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { EvidenciaId, DiscoveryId, HipoteseId, TipoEvidenciaVO } from '../value-objects';

interface EvidenciaProps {
  id?: EvidenciaId;
  tenantId: TenantId;
  discoveryId: DiscoveryId;
  hipoteseId?: HipoteseId;
  tipo: TipoEvidenciaVO;
  titulo: string;
  descricao: string;
  arquivoUrl?: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Evidencia {
  private readonly props: EvidenciaProps;

  constructor(props: EvidenciaProps) {
    this.validateProps(props);
    this.props = props;
  }

  private validateProps(props: EvidenciaProps): void {
    if (!props.titulo || props.titulo.trim().length === 0) {
      throw new Error('Título é obrigatório');
    }

    if (!props.descricao || props.descricao.trim().length === 0) {
      throw new Error('Descrição é obrigatória');
    }

    // Validate file requirement based on type
    if (props.tipo.requiresFile() && !props.arquivoUrl) {
      throw new Error(`Tipo de evidência ${props.tipo.getLabel()} requer arquivo`);
    }
  }

  get id(): EvidenciaId | undefined {
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

  get tipo(): TipoEvidenciaVO {
    return this.props.tipo;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get arquivoUrl(): string | undefined {
    return this.props.arquivoUrl;
  }

  get tags(): string[] {
    return this.props.tags;
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
  hasFile(): boolean {
    return !!this.props.arquivoUrl;
  }

  isLinkedToHipotese(): boolean {
    return !!this.props.hipoteseId;
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

  linkToHipotese(hipoteseId: HipoteseId): void {
    this.props.hipoteseId = hipoteseId;
  }

  unlinkFromHipotese(): void {
    this.props.hipoteseId = undefined;
  }

  updateArquivoUrl(arquivoUrl: string): void {
    if (this.props.tipo.requiresFile() && !arquivoUrl) {
      throw new Error(`Tipo de evidência ${this.props.tipo.getLabel()} requer arquivo`);
    }
    this.props.arquivoUrl = arquivoUrl;
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

  // Factory method
  static create(
    props: Omit<EvidenciaProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
      tags?: string[];
    },
  ): Evidencia {
    return new Evidencia({
      ...props,
      tags: props.tags || [],
    });
  }

  // Reconstitution from persistence
  static fromPersistence(props: EvidenciaProps): Evidencia {
    return new Evidencia(props);
  }
}
