import { QuarterVO } from '../value-objects';

export interface CapacitySnapshotProps {
  id?: string;
  tenantId: string;
  squadId: string;
  quarter: QuarterVO;
  capacidadeTotal: number;
  capacidadeUsada: number;
  bufferPercentual: number;
  ajustesJson?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CapacitySnapshot {
  private props: CapacitySnapshotProps;

  private constructor(props: CapacitySnapshotProps) {
    this.props = props;
  }

  static create(
    props: Omit<CapacitySnapshotProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): CapacitySnapshot {
    CapacitySnapshot.validarCapacidades(props.capacidadeTotal, props.capacidadeUsada);

    return new CapacitySnapshot({
      ...props,
      bufferPercentual: props.bufferPercentual ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: CapacitySnapshotProps): CapacitySnapshot {
    return new CapacitySnapshot(props);
  }

  atualizarCapacidade(total: number, usada: number): void {
    CapacitySnapshot.validarCapacidades(total, usada);
    this.props.capacidadeTotal = total;
    this.props.capacidadeUsada = usada;
    this.touch();
  }

  atualizarBuffer(percentual: number): void {
    if (percentual < 0 || percentual > 100) {
      throw new Error('Buffer deve estar entre 0% e 100%');
    }
    this.props.bufferPercentual = percentual;
    this.touch();
  }

  aplicarAjustes(ajustes: Record<string, unknown>): void {
    this.props.ajustesJson = ajustes;
    this.touch();
  }

  getUtilizacaoPercentual(): number {
    if (this.props.capacidadeTotal === 0) {
      return 0;
    }

    return Number(((this.props.capacidadeUsada / this.props.capacidadeTotal) * 100).toFixed(2));
  }

  isSobrecarregado(): boolean {
    return this.getUtilizacaoPercentual() > 110;
  }

  toObject(): CapacitySnapshotProps {
    return { ...this.props };
  }

  private static validarCapacidades(total: number, usada: number): void {
    if (total < 0 || usada < 0) {
      throw new Error('Capacidade não pode ser negativa');
    }

    if (usada > total * 1.5) {
      throw new Error('Capacidade usada não pode exceder 150% do total');
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
