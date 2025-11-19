import { QuarterVO, PlanningCycleStatusVO } from '../value-objects';

export interface ChecklistEntry {
  chave: string;
  label: string;
  concluido: boolean;
  responsavel?: string;
}

export interface PlanningCycleProps {
  id?: string;
  tenantId: string;
  produtoId?: string;
  quarter: QuarterVO;
  status: PlanningCycleStatusVO;
  faseAtual: number;
  checklist: ChecklistEntry[];
  agendaUrl?: string;
  participantesConfirmados?: number;
  participantesTotais?: number;
  dadosPreparacao?: Record<string, unknown>;
  iniciadoEm?: Date;
  finalizadoEm?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PlanningCycle {
  private props: PlanningCycleProps;

  private constructor(props: PlanningCycleProps) {
    this.props = props;
  }

  static create(
    props: Omit<
      PlanningCycleProps,
      'id' | 'faseAtual' | 'checklist' | 'iniciadoEm' | 'finalizadoEm' | 'createdAt' | 'updatedAt'
    > & { checklist?: ChecklistEntry[]; faseAtual?: number },
  ): PlanningCycle {
    if (!props.status) {
      throw new Error('Planning cycle must have a status');
    }

    return new PlanningCycle({
      ...props,
      faseAtual: props.faseAtual ?? 1,
      checklist: props.checklist ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: PlanningCycleProps): PlanningCycle {
    return new PlanningCycle(props);
  }

  atualizarStatus(status: PlanningCycleStatusVO, faseAtual?: number): void {
    this.props.status = status;
    if (faseAtual) {
      this.props.faseAtual = faseAtual;
    }
    if (!this.props.iniciadoEm) {
      this.props.iniciadoEm = new Date();
    }
    if (status.isClosed()) {
      this.props.finalizadoEm = new Date();
    }
    this.touch();
  }

  atualizarChecklist(checklist: ChecklistEntry[]): void {
    this.props.checklist = checklist;
    this.touch();
  }

  registrarParticipantes({ confirmados, total }: { confirmados: number; total: number }): void {
    this.props.participantesConfirmados = confirmados;
    this.props.participantesTotais = total;
    this.touch();
  }

  atualizarAgenda(url?: string): void {
    this.props.agendaUrl = url;
    this.touch();
  }

  atualizarDadosPreparacao(dados: Record<string, unknown>): void {
    this.props.dadosPreparacao = dados;
    this.touch();
  }

  toObject(): PlanningCycleProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
