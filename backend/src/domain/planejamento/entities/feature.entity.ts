import { FeatureStatusVO } from '../value-objects';

export interface FeatureProps {
  id?: string;
  tenantId: string;
  epicoId: string;
  titulo: string;
  descricao?: string;
  squadId?: string;
  pontos?: number;
  status: FeatureStatusVO;
  riscos?: string;
  dependenciasIds?: string[];
  criteriosAceite?: string;
  revisadoPorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Feature {
  private props: FeatureProps;

  private constructor(props: FeatureProps) {
    this.props = props;
  }

  static create(
    props: Omit<FeatureProps, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
      status?: FeatureStatusVO;
    },
  ): Feature {
    return new Feature({
      ...props,
      status: props.status ?? FeatureStatusVO.planned(),
      dependenciasIds: props.dependenciasIds ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: FeatureProps): Feature {
    return new Feature(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get status(): FeatureStatusVO {
    return this.props.status;
  }

  atualizarStatus(novoStatus: FeatureStatusVO): void {
    this.props.status = novoStatus;
    this.touch();
  }

  atualizarDetalhes({
    descricao,
    pontos,
    riscos,
    criteriosAceite,
  }: Partial<Pick<FeatureProps, 'descricao' | 'pontos' | 'riscos' | 'criteriosAceite'>>): void {
    if (descricao !== undefined) {
      this.props.descricao = descricao;
    }
    if (pontos !== undefined) {
      if (pontos < 0) {
        throw new Error('Pontos não podem ser negativos');
      }
      this.props.pontos = pontos;
    }
    if (riscos !== undefined) {
      this.props.riscos = riscos;
    }
    if (criteriosAceite !== undefined) {
      this.props.criteriosAceite = criteriosAceite;
    }
    this.touch();
  }

  atribuirSquad(squadId?: string): void {
    this.props.squadId = squadId;
    this.touch();
  }

  revisarEstimativa(usuarioId: string): void {
    this.props.revisadoPorId = usuarioId;
    this.touch();
  }

  definirDependencias(ids: string[]): void {
    this.props.dependenciasIds = [...new Set(ids)];
    this.touch();
  }

  toObject(): FeatureProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
