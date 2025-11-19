import { CenarioStatusVO, QuarterVO } from '../value-objects';

export interface AjusteCapacidade {
  squadId: string;
  deltaPercentual: number;
}

export interface ResultadoCenario {
  cabemEpicos: string[];
  atrasadosEpicos: string[];
  comentarios?: string[];
}

export interface CenarioSimuladoProps {
  id?: string;
  tenantId: string;
  nome: string;
  descricao?: string;
  planningCycleId?: string | null;
  quarter: QuarterVO;
  status: CenarioStatusVO;
  ajustesCapacidade: AjusteCapacidade[];
  incluirContractors: boolean;
  considerarFerias: boolean;
  bufferRiscoPercentual: number;
  resultado?: ResultadoCenario;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CenarioSimulado {
  private props: CenarioSimuladoProps;

  private constructor(props: CenarioSimuladoProps) {
    this.props = props;
  }

  static create(
    props: Omit<
      CenarioSimuladoProps,
      'id' | 'ajustesCapacidade' | 'resultado' | 'createdAt' | 'updatedAt'
    > & { ajustesCapacidade?: AjusteCapacidade[] },
  ): CenarioSimulado {
    return new CenarioSimulado({
      ...props,
      ajustesCapacidade: props.ajustesCapacidade ?? [],
      bufferRiscoPercentual: props.bufferRiscoPercentual ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: CenarioSimuladoProps): CenarioSimulado {
    return new CenarioSimulado(props);
  }

  atualizarAjustes(ajustes: AjusteCapacidade[]): void {
    ajustes.forEach((ajuste) => {
      if (Math.abs(ajuste.deltaPercentual) > 100) {
        throw new Error('Ajuste de capacidade não pode exceder 100%');
      }
    });
    this.props.ajustesCapacidade = ajustes;
    this.touch();
  }

  atualizarParametros(options: {
    incluirContractors?: boolean;
    considerarFerias?: boolean;
    bufferRiscoPercentual?: number;
  }): void {
    if (options.bufferRiscoPercentual !== undefined) {
      if (options.bufferRiscoPercentual < 0 || options.bufferRiscoPercentual > 100) {
        throw new Error('Buffer de risco deve estar entre 0 e 100%');
      }
      this.props.bufferRiscoPercentual = options.bufferRiscoPercentual;
    }
    if (options.incluirContractors !== undefined) {
      this.props.incluirContractors = options.incluirContractors;
    }
    if (options.considerarFerias !== undefined) {
      this.props.considerarFerias = options.considerarFerias;
    }
    this.touch();
  }

  definirStatus(novoStatus: CenarioStatusVO): void {
    if (!this.props.status.canTransitionTo(novoStatus)) {
      throw new Error(
        `Transição de status inválida (${this.props.status.slug} → ${novoStatus.slug})`,
      );
    }
    this.props.status = novoStatus;
    this.touch();
  }

  publicar(statusPublicado: CenarioStatusVO): void {
    this.definirStatus(statusPublicado);
  }

  arquivar(statusArquivado: CenarioStatusVO): void {
    this.definirStatus(statusArquivado);
  }

  registrarResultado(resultado: ResultadoCenario): void {
    this.props.resultado = resultado;
    this.touch();
  }

  toObject(): CenarioSimuladoProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
