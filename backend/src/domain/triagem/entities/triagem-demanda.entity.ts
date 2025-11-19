import {
  StatusTriagem,
  StatusTriagemEnum,
  Impacto,
  Urgencia,
  Complexidade,
} from '../value-objects';

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
}

export interface TriagemDemandaProps {
  id: string;
  demandaId: string;
  statusTriagem: StatusTriagem;
  impacto?: Impacto;
  urgencia?: Urgencia;
  complexidadeEstimada?: Complexidade;
  checklist: ChecklistItem[];
  triadoPorId?: string;
  triadoEm?: Date;
  revisoesTriagem: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TriagemDemanda {
  private readonly props: TriagemDemandaProps;

  constructor(props: TriagemDemandaProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get demandaId(): string {
    return this.props.demandaId;
  }

  get statusTriagem(): StatusTriagem {
    return this.props.statusTriagem;
  }

  get impacto(): Impacto | undefined {
    return this.props.impacto;
  }

  get urgencia(): Urgencia | undefined {
    return this.props.urgencia;
  }

  get complexidadeEstimada(): Complexidade | undefined {
    return this.props.complexidadeEstimada;
  }

  get checklist(): ChecklistItem[] {
    return this.props.checklist ?? [];
  }

  get triadoPorId(): string | undefined {
    return this.props.triadoPorId;
  }

  get triadoEm(): Date | undefined {
    return this.props.triadoEm;
  }

  get revisoesTriagem(): number {
    return this.props.revisoesTriagem;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  isProntoParaDiscovery(): boolean {
    const checklistCompleto = this.getChecklistPendentes().length === 0;
    const avaliacoesCompletas = !!(this.impacto && this.urgencia && this.complexidadeEstimada);
    return checklistCompleto && avaliacoesCompletas;
  }

  getChecklistPendentes(): ChecklistItem[] {
    return this.checklist.filter((item) => item.required && !item.completed);
  }

  calcularPrioridade(): number {
    if (!this.impacto || !this.urgencia || !this.complexidadeEstimada) {
      return 0;
    }
    return this.complexidadeEstimada.calcularPrioridade(this.impacto.peso, this.urgencia.peso);
  }

  atualizarStatus(novoStatus: StatusTriagemEnum, triadoPorId: string): void {
    if (!this.statusTriagem.canTransitionTo(novoStatus)) {
      throw new Error(`Transição inválida de ${this.statusTriagem.value} para ${novoStatus}`);
    }

    this.props.statusTriagem = new StatusTriagem(novoStatus);
    this.props.updatedAt = new Date();

    // Se está indo para um status final, registra quem e quando
    if (
      [
        StatusTriagemEnum.PRONTO_DISCOVERY,
        StatusTriagemEnum.EVOLUIU_EPICO,
        StatusTriagemEnum.ARQUIVADO_TRIAGEM,
        StatusTriagemEnum.DUPLICADO,
      ].includes(novoStatus)
    ) {
      this.props.triadoPorId = triadoPorId;
      this.props.triadoEm = new Date();
    }
  }

  definirAvaliacao(impacto?: Impacto, urgencia?: Urgencia, complexidade?: Complexidade): void {
    if (impacto) this.props.impacto = impacto;
    if (urgencia) this.props.urgencia = urgencia;
    if (complexidade) this.props.complexidadeEstimada = complexidade;
    this.props.updatedAt = new Date();
  }

  marcarChecklistItem(itemId: string, completed: boolean): void {
    const item = this.checklist.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`Item de checklist não encontrado: ${itemId}`);
    }

    item.completed = completed;
    item.completedAt = completed ? new Date() : undefined;
    this.props.updatedAt = new Date();
  }

  incrementarRevisoes(): void {
    this.props.revisoesTriagem += 1;
    this.props.updatedAt = new Date();
  }

  static criarNova(demandaId: string): TriagemDemanda {
    const checklistPadrao: ChecklistItem[] = [
      { id: 'desc_clara', label: 'Descrição clara', required: true, completed: false },
      {
        id: 'produto_correto',
        label: 'Alinhado com produto correto',
        required: true,
        completed: false,
      },
      { id: 'evidencias', label: 'Evidências fornecidas', required: false, completed: false },
      { id: 'impacto_definido', label: 'Impacto definido', required: true, completed: false },
      { id: 'urgencia_definida', label: 'Urgência definida', required: true, completed: false },
      {
        id: 'cliente_citado',
        label: 'Cliente citado (se aplicável)',
        required: false,
        completed: false,
      },
      { id: 'sem_duplicacao', label: 'Não há duplicações', required: true, completed: false },
    ];

    return new TriagemDemanda({
      id: '', // Will be set by repository
      demandaId,
      statusTriagem: new StatusTriagem(StatusTriagemEnum.PENDENTE_TRIAGEM),
      checklist: checklistPadrao,
      revisoesTriagem: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
