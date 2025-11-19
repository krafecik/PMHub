import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { DiscoveryId } from '../value-objects/discovery-id.vo';
import { DecisaoDiscoveryId } from '../value-objects/decisao-discovery-id.vo';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';

interface DecisaoDiscoveryProps {
  id?: DecisaoDiscoveryId;
  tenantId: TenantId;
  discoveryId: DiscoveryId;
  statusFinal: CatalogItemVO;
  resumo: string;
  aprendizados: string[];
  recomendacoes: string[];
  proximosPassos: string[];
  materiaisAnexos?: Record<string, unknown> | null;
  decididoPorId: UserId;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DecisaoDiscovery {
  constructor(private readonly props: DecisaoDiscoveryProps) {}

  get id(): DecisaoDiscoveryId | undefined {
    return this.props.id;
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get discoveryId(): DiscoveryId {
    return this.props.discoveryId;
  }

  get statusFinal(): CatalogItemVO {
    return this.props.statusFinal;
  }

  get resumo(): string {
    return this.props.resumo;
  }

  get aprendizados(): string[] {
    return this.props.aprendizados;
  }

  get recomendacoes(): string[] {
    return this.props.recomendacoes;
  }

  get proximosPassos(): string[] {
    return this.props.proximosPassos;
  }

  get materiaisAnexos(): Record<string, unknown> | null | undefined {
    return this.props.materiaisAnexos;
  }

  get decididoPorId(): UserId {
    return this.props.decididoPorId;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  updateResumo(resumo: string): void {
    if (!resumo || resumo.trim().length === 0) {
      throw new Error('Resumo da decisão não pode ser vazio');
    }
    this.props.resumo = resumo;
  }

  updateAprendizados(aprendizados: string[]): void {
    this.props.aprendizados = aprendizados;
  }

  updateRecomendacoes(recomendacoes: string[]): void {
    this.props.recomendacoes = recomendacoes;
  }

  updateProximosPassos(proximosPassos: string[]): void {
    this.props.proximosPassos = proximosPassos;
  }

  updateMateriaisAnexos(materiais: Record<string, unknown> | null | undefined): void {
    this.props.materiaisAnexos = materiais ?? null;
  }

  static create(
    props: Omit<DecisaoDiscoveryProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): DecisaoDiscovery {
    if (!props.resumo || props.resumo.trim().length === 0) {
      throw new Error('Resumo da decisão é obrigatório');
    }

    return new DecisaoDiscovery({
      ...props,
    });
  }

  static fromPersistence(props: DecisaoDiscoveryProps): DecisaoDiscovery {
    return new DecisaoDiscovery(props);
  }
}
