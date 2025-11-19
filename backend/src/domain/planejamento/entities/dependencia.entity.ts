import { DependenciaTipoVO, DependenciaRiscoVO } from '../value-objects';

export interface DependenciaProps {
  id?: string;
  tenantId: string;
  featureBloqueadaId: string;
  featureBloqueadoraId: string;
  tipo: DependenciaTipoVO;
  risco: DependenciaRiscoVO;
  nota?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Dependencia {
  private props: DependenciaProps;

  private constructor(props: DependenciaProps) {
    this.props = props;
  }

  static create(props: Omit<DependenciaProps, 'id' | 'createdAt' | 'updatedAt'>): Dependencia {
    if (props.featureBloqueadaId === props.featureBloqueadoraId) {
      throw new Error('Uma feature não pode depender de si mesma');
    }

    return new Dependencia({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: DependenciaProps): Dependencia {
    return new Dependencia(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }

  atualizarRisco(risco: DependenciaRiscoVO): void {
    this.props.risco = risco;
    this.touch();
  }

  atualizarTipo(tipo: DependenciaTipoVO): void {
    this.props.tipo = tipo;
    this.touch();
  }

  adicionarNota(nota?: string): void {
    this.props.nota = nota;
    this.touch();
  }

  toObject(): DependenciaProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
