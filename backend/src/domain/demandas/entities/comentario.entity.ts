export interface ComentarioProps {
  id?: string;
  demandaId: string;
  usuarioId: string;
  texto: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Comentario {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 5000;

  private props: ComentarioProps;

  private constructor(props: ComentarioProps) {
    this.props = props;
  }

  static create(props: Omit<ComentarioProps, 'createdAt' | 'updatedAt'>): Comentario {
    const { texto } = props;
    
    if (!texto || texto.trim().length < Comentario.MIN_LENGTH) {
      throw new Error('Comentário não pode estar vazio');
    }

    if (texto.length > Comentario.MAX_LENGTH) {
      throw new Error(
        `Comentário deve ter no máximo ${Comentario.MAX_LENGTH} caracteres`
      );
    }

    return new Comentario({
      ...props,
      texto: texto.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: ComentarioProps): Comentario {
    return new Comentario(props);
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get demandaId(): string {
    return this.props.demandaId;
  }

  get usuarioId(): string {
    return this.props.usuarioId;
  }

  get texto(): string {
    return this.props.texto;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Business methods
  atualizar(novoTexto: string): void {
    if (!novoTexto || novoTexto.trim().length < Comentario.MIN_LENGTH) {
      throw new Error('Comentário não pode estar vazio');
    }

    if (novoTexto.length > Comentario.MAX_LENGTH) {
      throw new Error(
        `Comentário deve ter no máximo ${Comentario.MAX_LENGTH} caracteres`
      );
    }

    this.props.texto = novoTexto.trim();
    this.props.updatedAt = new Date();
  }

  foiEditado(): boolean {
    if (!this.props.createdAt || !this.props.updatedAt) {
      return false;
    }
    
    // Considera editado se updatedAt é mais de 1 segundo após createdAt
    return this.props.updatedAt.getTime() - this.props.createdAt.getTime() > 1000;
  }

  toObject(): ComentarioProps {
    return { ...this.props };
  }
}
