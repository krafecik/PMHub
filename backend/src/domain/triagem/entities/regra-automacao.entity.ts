export interface Condicao {
  campo: string;
  operador: 'igual' | 'diferente' | 'contem' | 'nao_contem' | 'maior' | 'menor';
  valor: any;
}

export interface CondicaoGrupo {
  operadorLogico: 'E' | 'OU';
  condicoes: Condicao[];
}

export interface Acao {
  tipo:
    | 'atribuir_pm'
    | 'definir_urgencia'
    | 'definir_impacto'
    | 'adicionar_tag'
    | 'enviar_notificacao';
  parametros: Record<string, any>;
}

export interface RegraAutomacaoProps {
  id: string;
  nome: string;
  descricao?: string;
  condicoes: CondicaoGrupo;
  acoes: Acao[];
  ativo: boolean;
  ordem: number;
  criadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RegraAutomacao {
  private readonly props: RegraAutomacaoProps;

  constructor(props: RegraAutomacaoProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get condicoes(): CondicaoGrupo {
    return this.props.condicoes;
  }

  get acoes(): Acao[] {
    return this.props.acoes;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get ordem(): number {
    return this.props.ordem;
  }

  get criadoPorId(): string {
    return this.props.criadoPorId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic
  ativar(): void {
    this.props.ativo = true;
    this.props.updatedAt = new Date();
  }

  desativar(): void {
    this.props.ativo = false;
    this.props.updatedAt = new Date();
  }

  atualizarOrdem(novaOrdem: number): void {
    this.props.ordem = novaOrdem;
    this.props.updatedAt = new Date();
  }

  avaliarCondicoes(contexto: Record<string, any>): boolean {
    const { operadorLogico, condicoes } = this.props.condicoes;

    if (operadorLogico === 'E') {
      return condicoes.every((condicao) => this.avaliarCondicao(condicao, contexto));
    } else {
      return condicoes.some((condicao) => this.avaliarCondicao(condicao, contexto));
    }
  }

  private avaliarCondicao(condicao: Condicao, contexto: Record<string, any>): boolean {
    const valorContexto = contexto[condicao.campo];

    switch (condicao.operador) {
      case 'igual':
        return valorContexto === condicao.valor;
      case 'diferente':
        return valorContexto !== condicao.valor;
      case 'contem':
        return String(valorContexto).toLowerCase().includes(String(condicao.valor).toLowerCase());
      case 'nao_contem':
        return !String(valorContexto).toLowerCase().includes(String(condicao.valor).toLowerCase());
      case 'maior':
        return Number(valorContexto) > Number(condicao.valor);
      case 'menor':
        return Number(valorContexto) < Number(condicao.valor);
      default:
        return false;
    }
  }

  static criar(
    nome: string,
    condicoes: CondicaoGrupo,
    acoes: Acao[],
    criadoPorId: string,
    descricao?: string,
  ): RegraAutomacao {
    return new RegraAutomacao({
      id: '', // Will be set by repository
      nome,
      descricao,
      condicoes,
      acoes,
      ativo: true,
      ordem: 0,
      criadoPorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
