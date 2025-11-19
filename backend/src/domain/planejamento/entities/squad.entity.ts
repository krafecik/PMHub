import { SquadStatusVO } from '../value-objects';

export interface SquadProps {
  id?: string;
  tenantId: string;
  produtoId?: string;
  nome: string;
  slug: string;
  descricao?: string;
  status: SquadStatusVO;
  corToken?: string;
  timezone?: string;
  capacidadePadrao?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Squad {
  private props: SquadProps;

  private constructor(props: SquadProps) {
    this.props = props;
  }

  static create(props: Omit<SquadProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Squad {
    return new Squad({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: SquadProps): Squad {
    return new Squad(props);
  }

  atualizarDados({
    nome,
    descricao,
    corToken,
    timezone,
    capacidadePadrao,
  }: Partial<Omit<SquadProps, 'id' | 'tenantId' | 'slug' | 'status'>>): void {
    if (nome) this.props.nome = nome;
    if (descricao !== undefined) this.props.descricao = descricao;
    if (corToken !== undefined) this.props.corToken = corToken;
    if (timezone !== undefined) this.props.timezone = timezone;
    if (capacidadePadrao !== undefined) {
      if (capacidadePadrao < 0) {
        throw new Error('Capacidade padrão não pode ser negativa');
      }
      this.props.capacidadePadrao = capacidadePadrao;
    }
    this.touch();
  }

  alterarStatus(status: SquadStatusVO): void {
    this.props.status = status;
    this.touch();
  }

  toObject(): SquadProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
