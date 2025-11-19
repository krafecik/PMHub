import { AggregateRoot } from '@core/domain/aggregate-root';
import { DocumentoId } from '../value-objects/documento-id.vo';
import { DocumentoTipoVO } from '../value-objects/documento-tipo.vo';
import { DocumentoStatusVO } from '../value-objects/documento-status.vo';
import {
  DocumentoVersao,
  DocumentoVersaoProps,
  RegraNegocioProps,
  RequisitoFuncionalProps,
  RequisitoNaoFuncionalProps,
  CriterioAceiteProps,
  RiscoProps,
  ContextoProps,
  FluxoProps,
} from './documento-versao.entity';
import { VersaoVO } from '../value-objects/versao.vo';
import { DocumentoCriadoEvent } from '../events/documento-criado.event';
import { DocumentoVersaoCriadaEvent } from '../events/documento-versao-criada.event';
import { DocumentoAtualizadoEvent } from '../events/documento-atualizado.event';

export interface DocumentoProps {
  tenantId: string;
  tipo: DocumentoTipoVO;
  titulo: string;
  resumo?: string;
  status: DocumentoStatusVO;
  produtoId?: string;
  pmId?: string;
  squadId?: string;
  criadoPorId: string;
  atualizadoPorId?: string;
  versoes?: DocumentoVersao[];
  versaoAtual?: DocumentoVersao | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Documento extends AggregateRoot<DocumentoId> {
  private props: DocumentoProps;

  private constructor(props: DocumentoProps, id?: DocumentoId) {
    super(id ?? new DocumentoId());
    this.props = {
      ...props,
      versoes: props.versoes ?? [],
      versaoAtual: props.versaoAtual ?? null,
    };
  }

  static criar(
    props: Omit<DocumentoProps, 'versoes' | 'versaoAtual'> & {
      versaoInicial?: DocumentoVersaoProps;
    },
  ): Documento {
    const documento = new Documento({
      ...props,
      versoes: [],
      versaoAtual: null,
    });

    if (props.versaoInicial) {
      const versao = new DocumentoVersao({
        ...props.versaoInicial,
        documentoId: documento.id.toValue(),
        tenantId: props.tenantId,
        versao: props.versaoInicial.versao ?? new VersaoVO('1.0'),
      });
      documento.adicionarVersao(versao, false);
    }

    documento.addDomainEvent(
      new DocumentoCriadoEvent(
        documento.id.toValue(),
        props.tenantId,
        props.tipo.getValue(),
        props.titulo,
      ),
    );

    return documento;
  }

  static restaurar(props: DocumentoProps, id: DocumentoId): Documento {
    return new Documento(props, id);
  }

  get idValue(): string {
    return this.id.toValue();
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get tipo(): DocumentoTipoVO {
    return this.props.tipo;
  }

  get status(): DocumentoStatusVO {
    return this.props.status;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get resumo(): string | undefined {
    return this.props.resumo;
  }

  get produtoId(): string | undefined {
    return this.props.produtoId;
  }

  get pmId(): string | undefined {
    return this.props.pmId;
  }

  get squadId(): string | undefined {
    return this.props.squadId;
  }

  get versaoAtual(): DocumentoVersao | null {
    return this.props.versaoAtual ?? null;
  }

  get versoes(): DocumentoVersao[] {
    return this.props.versoes ?? [];
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get criadoPorId(): string {
    return this.props.criadoPorId;
  }

  get atualizadoPorId(): string | undefined {
    return this.props.atualizadoPorId;
  }

  atualizarCabecalho(params: {
    titulo?: string;
    resumo?: string;
    tipo?: DocumentoTipoVO;
    status?: DocumentoStatusVO;
    produtoId?: string;
    pmId?: string;
    squadId?: string;
    atualizadoPorId?: string;
  }): void {
    if (params.titulo) {
      this.props.titulo = params.titulo;
    }

    if (params.resumo !== undefined) {
      this.props.resumo = params.resumo;
    }

    if (params.tipo) {
      this.props.tipo = params.tipo;
    }

    if (params.status) {
      this.props.status = params.status;
    }

    this.props.produtoId = params.produtoId ?? this.props.produtoId;
    this.props.pmId = params.pmId ?? this.props.pmId;
    this.props.squadId = params.squadId ?? this.props.squadId;
    this.props.atualizadoPorId = params.atualizadoPorId ?? this.props.atualizadoPorId;

    this.addDomainEvent(
      new DocumentoAtualizadoEvent(this.idValue, this.props.tenantId, this.props.status.getValue()),
    );
  }

  adicionarVersao(versao: DocumentoVersao, raiseEvent = true): void {
    if (!this.props.versoes) {
      this.props.versoes = [];
    }

    this.props.versoes.push(versao);
    this.props.versaoAtual = versao;

    if (raiseEvent) {
      this.addDomainEvent(
        new DocumentoVersaoCriadaEvent(this.idValue, this.props.tenantId, versao.versao.getValue()),
      );
    }
  }

  atualizarObjetivo(texto: string | undefined): void {
    const versao = this.buscarVersaoAtual();
    versao.objetivo = texto;
  }

  atualizarContexto(contexto: ContextoProps | undefined): void {
    const versao = this.buscarVersaoAtual();
    versao.contexto = contexto;
  }

  atualizarFluxos(fluxos: FluxoProps | undefined): void {
    const versao = this.buscarVersaoAtual();
    versao.fluxos = fluxos;
  }

  atualizarRequisitosFuncionais(lista: RequisitoFuncionalProps[]): void {
    const versao = this.buscarVersaoAtual();
    versao.requisitosFuncionais = lista;
  }

  atualizarRegrasNegocio(lista: RegraNegocioProps[]): void {
    const versao = this.buscarVersaoAtual();
    versao.regrasNegocio = lista;
  }

  atualizarRequisitosNaoFuncionais(lista: RequisitoNaoFuncionalProps[]): void {
    const versao = this.buscarVersaoAtual();
    versao.requisitosNaoFuncionais = lista;
  }

  atualizarCriteriosAceite(lista: CriterioAceiteProps[]): void {
    const versao = this.buscarVersaoAtual();
    versao.criteriosAceite = lista;
  }

  atualizarRiscos(lista: RiscoProps[]): void {
    const versao = this.buscarVersaoAtual();
    versao.riscos = lista;
  }

  toJSON() {
    return {
      id: this.idValue,
      tenantId: this.props.tenantId,
      tipo: this.props.tipo.getValue(),
      titulo: this.props.titulo,
      resumo: this.props.resumo,
      status: this.props.status.getValue(),
      produtoId: this.props.produtoId,
      pmId: this.props.pmId,
      squadId: this.props.squadId,
      versaoAtual: this.versaoAtual?.toJSON(),
      versoes: this.versoes.map((versao) => versao.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private buscarVersaoAtual(): DocumentoVersao {
    if (!this.props.versaoAtual) {
      throw new Error('Documento não possui versão atual definida');
    }

    return this.props.versaoAtual;
  }
}
