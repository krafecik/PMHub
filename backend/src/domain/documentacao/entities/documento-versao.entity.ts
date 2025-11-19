import { VersaoVO } from '../value-objects/versao.vo';

export interface RegraNegocioProps {
  id?: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  origem: string;
  impacto: string;
  modulo?: string;
  impactoNegocio?: string;
}

export interface RequisitoFuncionalProps {
  id?: string;
  codigo: string;
  descricao: string;
  prioridade?: string;
}

export interface RequisitoNaoFuncionalProps {
  id?: string;
  categoria: string;
  descricao: string;
  metrica?: string;
}

export interface CriterioAceiteProps {
  id?: string;
  codigo?: string;
  descricao: string;
  cenario?: string;
}

export interface RiscoProps {
  id?: string;
  descricao: string;
  probabilidade: string;
  impacto: string;
  mitigacao?: string;
}

export interface FluxoProps {
  diagramaUrl?: string;
  descricao?: string;
}

export interface ContextoProps {
  problema?: string;
  dados?: string;
  personas?: string;
}

export interface DocumentoVersaoProps {
  id?: string;
  documentoId: string;
  tenantId: string;
  versao: VersaoVO;
  objetivo?: string;
  contexto?: ContextoProps;
  requisitosFuncionais?: RequisitoFuncionalProps[];
  regrasNegocio?: RegraNegocioProps[];
  requisitosNaoFuncionais?: RequisitoNaoFuncionalProps[];
  fluxos?: FluxoProps;
  criteriosAceite?: CriterioAceiteProps[];
  riscos?: RiscoProps[];
  changelogResumo?: string;
  conteudoJson?: Record<string, any>;
  createdAt?: Date;
  createdBy?: string;
}

export class DocumentoVersao {
  private props: DocumentoVersaoProps;

  constructor(props: DocumentoVersaoProps) {
    this.props = {
      ...props,
      requisitosFuncionais: props.requisitosFuncionais ?? [],
      regrasNegocio: props.regrasNegocio ?? [],
      requisitosNaoFuncionais: props.requisitosNaoFuncionais ?? [],
      criteriosAceite: props.criteriosAceite ?? [],
      riscos: props.riscos ?? [],
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get versao(): VersaoVO {
    return this.props.versao;
  }

  get documentoId(): string {
    return this.props.documentoId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get objetivo(): string | undefined {
    return this.props.objetivo;
  }

  set objetivo(value: string | undefined) {
    this.props.objetivo = value;
  }

  get contexto(): ContextoProps | undefined {
    return this.props.contexto;
  }

  set contexto(value: ContextoProps | undefined) {
    this.props.contexto = value;
  }

  get requisitosFuncionais(): RequisitoFuncionalProps[] {
    return this.props.requisitosFuncionais ?? [];
  }

  set requisitosFuncionais(value: RequisitoFuncionalProps[]) {
    this.props.requisitosFuncionais = value;
  }

  get regrasNegocio(): RegraNegocioProps[] {
    return this.props.regrasNegocio ?? [];
  }

  set regrasNegocio(value: RegraNegocioProps[]) {
    this.props.regrasNegocio = value;
  }

  get requisitosNaoFuncionais(): RequisitoNaoFuncionalProps[] {
    return this.props.requisitosNaoFuncionais ?? [];
  }

  set requisitosNaoFuncionais(value: RequisitoNaoFuncionalProps[]) {
    this.props.requisitosNaoFuncionais = value;
  }

  get fluxos(): FluxoProps | undefined {
    return this.props.fluxos;
  }

  set fluxos(value: FluxoProps | undefined) {
    this.props.fluxos = value;
  }

  get criteriosAceite(): CriterioAceiteProps[] {
    return this.props.criteriosAceite ?? [];
  }

  set criteriosAceite(value: CriterioAceiteProps[]) {
    this.props.criteriosAceite = value;
  }

  get riscos(): RiscoProps[] {
    return this.props.riscos ?? [];
  }

  set riscos(value: RiscoProps[]) {
    this.props.riscos = value;
  }

  get changelogResumo(): string | undefined {
    return this.props.changelogResumo;
  }

  set changelogResumo(value: string | undefined) {
    this.props.changelogResumo = value;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.props.id,
      documentoId: this.props.documentoId,
      tenantId: this.props.tenantId,
      versao: this.props.versao.getValue(),
      objetivo: this.props.objetivo,
      contexto: this.props.contexto,
      requisitosFuncionais: this.requisitosFuncionais,
      regrasNegocio: this.regrasNegocio,
      requisitosNaoFuncionais: this.requisitosNaoFuncionais,
      fluxos: this.fluxos,
      criteriosAceite: this.criteriosAceite,
      riscos: this.riscos,
      changelogResumo: this.changelogResumo,
      conteudoJson: this.props.conteudoJson,
      createdAt: this.props.createdAt,
      createdBy: this.props.createdBy,
    };
  }
}
