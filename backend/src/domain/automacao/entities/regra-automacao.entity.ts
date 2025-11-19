import { AggregateRoot } from '@core/domain/aggregate-root';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { RegraAutomacaoId } from '../value-objects/regra-automacao-id.vo';
import { NomeRegra } from '../value-objects/nome-regra.vo';
import {
  CondicaoRegra,
  CondicaoRegraDTO,
  CondicaoRegraPersistence,
  CondicaoRegraProps,
} from '../value-objects/condicao-regra.vo';
import {
  AcaoExecucao,
  AcaoRegra,
  AcaoRegraDTO,
  AcaoRegraPersistence,
  AcaoRegraProps,
} from '../value-objects/acao-regra.vo';

export interface RegraAutomacaoProps {
  id?: string;
  tenantId: string;
  nome: string;
  descricao?: string;
  condicoes: CondicaoRegraProps[];
  acoes: AcaoRegraProps[];
  ativo: boolean;
  ordem?: number;
  criadoPor: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export interface RegraAutomacaoPersistence {
  id?: string;
  tenantId: string;
  nome: string;
  descricao?: string;
  condicoes: CondicaoRegraPersistence[];
  acoes: AcaoRegraPersistence[];
  ativo: boolean;
  ordem: number;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class RegraAutomacao extends AggregateRoot<RegraAutomacaoId> {
  private readonly tenantIdVO: TenantId;
  private nomeVO: NomeRegra;
  private descricaoValue?: string;
  private condicoesValue: CondicaoRegra[];
  private acoesValue: AcaoRegra[];
  private ativoValue: boolean;
  private ordemValue: number;
  private readonly criadoPorValue: string;
  private readonly criadoEmValue: Date;
  private atualizadoEmValue: Date;

  constructor(props: RegraAutomacaoProps) {
    super(new RegraAutomacaoId(props.id));
    this.tenantIdVO = new TenantId(props.tenantId);
    this.nomeVO = new NomeRegra(props.nome);
    this.descricaoValue = props.descricao;
    this.condicoesValue = props.condicoes.map((c) => new CondicaoRegra(c));
    this.acoesValue = props.acoes.map((a) => new AcaoRegra(a));
    this.ativoValue = props.ativo;
    this.ordemValue = props.ordem ?? 0;
    this.criadoPorValue = props.criadoPor;
    this.criadoEmValue = props.criadoEm ?? new Date();
    this.atualizadoEmValue = props.atualizadoEm ?? new Date();
  }

  get tenantId(): TenantId {
    return this.tenantIdVO;
  }

  get nome(): NomeRegra {
    return this.nomeVO;
  }

  get descricao(): string | undefined {
    return this.descricaoValue;
  }

  get condicoes(): CondicaoRegra[] {
    return this.condicoesValue;
  }

  get acoes(): AcaoRegra[] {
    return this.acoesValue;
  }

  get ativo(): boolean {
    return this.ativoValue;
  }

  get ordem(): number {
    return this.ordemValue;
  }

  get criadoPor(): string {
    return this.criadoPorValue;
  }

  get criadoEm(): Date {
    return this.criadoEmValue;
  }

  get atualizadoEm(): Date {
    return this.atualizadoEmValue;
  }

  static criar(
    props: Omit<RegraAutomacaoProps, 'id' | 'criadoEm' | 'atualizadoEm'>,
  ): RegraAutomacao {
    if (!props.condicoes || props.condicoes.length === 0) {
      throw new Error('Uma regra deve ter pelo menos uma condição');
    }

    if (!props.acoes || props.acoes.length === 0) {
      throw new Error('Uma regra deve ter pelo menos uma ação');
    }

    return new RegraAutomacao(props);
  }

  ativar(): void {
    if (this.ativoValue) {
      throw new Error('Regra já está ativa');
    }
    this.ativoValue = true;
    this.touch();
  }

  desativar(): void {
    if (!this.ativoValue) {
      throw new Error('Regra já está inativa');
    }
    this.ativoValue = false;
    this.touch();
  }

  atualizarNome(nome: string): void {
    this.nomeVO = new NomeRegra(nome);
    this.touch();
  }

  atualizarDescricao(descricao: string): void {
    this.descricaoValue = descricao;
    this.touch();
  }

  atualizarOrdem(ordem: number): void {
    if (ordem < 0) {
      throw new Error('Ordem deve ser maior ou igual a zero');
    }
    this.ordemValue = ordem;
    this.touch();
  }

  atualizarCondicoes(condicoes: CondicaoRegraProps[]): void {
    if (!condicoes || condicoes.length === 0) {
      throw new Error('Uma regra deve ter pelo menos uma condição');
    }
    this.condicoesValue = condicoes.map((c) => new CondicaoRegra(c));
    this.touch();
  }

  atualizarAcoes(acoes: AcaoRegraProps[]): void {
    if (!acoes || acoes.length === 0) {
      throw new Error('Uma regra deve ter pelo menos uma ação');
    }
    this.acoesValue = acoes.map((a) => new AcaoRegra(a));
    this.touch();
  }

  aplicaSeAoContexto(contexto: Record<string, any>): boolean {
    return this.condicoesValue.every((condicao) => condicao.avaliar(contexto));
  }

  obterAcoesParaExecutar(): AcaoExecucao[] {
    return this.acoesValue.map((acao) => acao.toExecution());
  }

  toPersistence(): RegraAutomacaoPersistence {
    return {
      id: this.id.toValue(),
      tenantId: this.tenantIdVO.getValue(),
      nome: this.nomeVO.getValue(),
      descricao: this.descricaoValue,
      condicoes: this.condicoesValue.map((condicao) => condicao.toPersistence()),
      acoes: this.acoesValue.map((acao) => acao.toPersistence()),
      ativo: this.ativoValue,
      ordem: this.ordemValue,
      criadoPor: this.criadoPorValue,
      criadoEm: this.criadoEmValue,
      atualizadoEm: this.atualizadoEmValue,
    };
  }

  toDTO(): {
    id: string | undefined;
    tenantId: string;
    nome: string;
    descricao?: string;
    condicoes: CondicaoRegraDTO[];
    acoes: AcaoRegraDTO[];
    ativo: boolean;
    ordem: number;
    criadoPor: string;
    criadoEm: Date;
    atualizadoEm: Date;
  } {
    return {
      id: this.id.toValue(),
      tenantId: this.tenantIdVO.getValue(),
      nome: this.nomeVO.getValue(),
      descricao: this.descricaoValue,
      condicoes: this.condicoesValue.map((condicao) => condicao.toDTO()),
      acoes: this.acoesValue.map((acao) => acao.toDTO()),
      ativo: this.ativoValue,
      ordem: this.ordemValue,
      criadoPor: this.criadoPorValue,
      criadoEm: this.criadoEmValue,
      atualizadoEm: this.atualizadoEmValue,
    };
  }

  static restaurar(
    snapshot: RegraAutomacaoPersistence,
    resolved: {
      condicoes: CondicaoRegraProps[];
      acoes: AcaoRegraProps[];
    },
  ): RegraAutomacao {
    return new RegraAutomacao({
      id: snapshot.id,
      tenantId: snapshot.tenantId,
      nome: snapshot.nome,
      descricao: snapshot.descricao,
      condicoes: resolved.condicoes,
      acoes: resolved.acoes,
      ativo: snapshot.ativo,
      ordem: snapshot.ordem,
      criadoPor: snapshot.criadoPor,
      criadoEm: snapshot.criadoEm,
      atualizadoEm: snapshot.atualizadoEm,
    });
  }

  private touch(): void {
    this.atualizadoEmValue = new Date();
  }
}
