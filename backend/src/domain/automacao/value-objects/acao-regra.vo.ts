import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

type AcaoValor = string | string[] | number | boolean | Record<string, any> | null | undefined;

export interface AcaoRegraProps {
  tipo: CatalogItemProps;
  campo?: CatalogItemProps;
  valor?: AcaoValor;
  configuracao?: Record<string, any>;
}

export interface AcaoRegraPersistence {
  tipoId: string;
  campoId?: string;
  valor?: AcaoValor;
  configuracao?: Record<string, any>;
}

export interface AcaoRegraDTO {
  tipoId: string;
  tipoSlug: string;
  tipoLabel: string;
  tipoMetadata: Record<string, unknown> | null;
  campoId?: string;
  campoSlug?: string;
  campoLabel?: string;
  campoMetadata?: Record<string, unknown> | null;
  valor?: AcaoValor;
  configuracao?: Record<string, any>;
}

export interface AcaoExecucao {
  codigo: string;
  tipoId: string;
  tipoSlug: string;
  tipoLabel: string;
  tipoMetadata: Record<string, unknown> | null;
  campoPath?: string;
  campoId?: string;
  campoSlug?: string;
  campoLabel?: string;
  valor?: AcaoValor;
  configuracao?: Record<string, any>;
}

export class AcaoRegra {
  private readonly tipo: CatalogItemVO;
  private readonly campo?: CatalogItemVO;
  private readonly codigo: string;
  private readonly valor?: AcaoValor;
  private readonly configuracao?: Record<string, any>;

  constructor(props: AcaoRegraProps) {
    const tipoItem = CatalogItemVO.create(props.tipo);
    tipoItem.ensureCategory(CatalogCategorySlugs.AUTOMACAO_ACOES);

    const codigo = AcaoRegra.extrairCodigo(tipoItem);

    const requiresField = AcaoRegra.acaoRequerCampo(tipoItem);
    if (requiresField && !props.campo) {
      throw new Error(`Campo é obrigatório para a ação ${tipoItem.slug}`);
    }

    const requiresValor = AcaoRegra.acaoRequerValor(tipoItem);
    if (requiresValor && props.valor === undefined) {
      throw new Error(`Valor é obrigatório para a ação ${tipoItem.slug}`);
    }

    const requiresConfig = AcaoRegra.acaoRequerConfiguracao(tipoItem);
    if (requiresConfig && !props.configuracao) {
      throw new Error(`Configuração é obrigatória para a ação ${tipoItem.slug}`);
    }

    const campoItem = props.campo ? CatalogItemVO.create(props.campo) : undefined;
    if (campoItem) {
      campoItem.ensureCategory(CatalogCategorySlugs.AUTOMACAO_CAMPOS);
    }

    this.tipo = tipoItem;
    this.campo = campoItem;
    this.codigo = codigo;
    this.valor = props.valor;
    this.configuracao = props.configuracao;
  }

  getTipo(): CatalogItemVO {
    return this.tipo;
  }

  getCampo(): CatalogItemVO | undefined {
    return this.campo;
  }

  getValor(): AcaoValor {
    return this.valor;
  }

  getConfiguracao(): Record<string, any> | undefined {
    return this.configuracao;
  }

  getCodigo(): string {
    return this.codigo;
  }

  private static extrairCodigo(tipo: CatalogItemVO): string {
    const legacy = (tipo.metadata?.legacyValue as string | undefined) ?? tipo.slug;
    return legacy.toUpperCase();
  }

  private static acaoRequerCampo(tipo: CatalogItemVO): boolean {
    const meta = tipo.metadata as Record<string, unknown> | null;
    return typeof meta?.requiresField === 'boolean' ? (meta.requiresField as boolean) : false;
  }

  private static acaoRequerValor(tipo: CatalogItemVO): boolean {
    const meta = tipo.metadata as Record<string, unknown> | null;
    return typeof meta?.requiresValue === 'boolean' ? (meta.requiresValue as boolean) : false;
  }

  private static acaoRequerConfiguracao(tipo: CatalogItemVO): boolean {
    const meta = tipo.metadata as Record<string, unknown> | null;
    return typeof meta?.requiresConfig === 'boolean' ? (meta.requiresConfig as boolean) : false;
  }

  private getCampoPath(): string | undefined {
    if (!this.campo) return undefined;
    const metadata = this.campo.metadata as Record<string, unknown> | null;
    const path = typeof metadata?.path === 'string' ? (metadata.path as string) : this.campo.slug;
    return path;
  }

  toPersistence(): AcaoRegraPersistence {
    return {
      tipoId: this.tipo.id,
      campoId: this.campo?.id,
      valor: this.valor,
      configuracao: this.configuracao,
    };
  }

  toDTO(): AcaoRegraDTO {
    return {
      tipoId: this.tipo.id,
      tipoSlug: this.tipo.slug,
      tipoLabel: this.tipo.label,
      tipoMetadata: (this.tipo.metadata as Record<string, unknown> | null) ?? null,
      campoId: this.campo?.id,
      campoSlug: this.campo?.slug,
      campoLabel: this.campo?.label,
      campoMetadata: (this.campo?.metadata as Record<string, unknown> | null) ?? null,
      valor: this.valor,
      configuracao: this.configuracao,
    };
  }

  toExecution(): AcaoExecucao {
    return {
      codigo: this.codigo,
      tipoId: this.tipo.id,
      tipoSlug: this.tipo.slug,
      tipoLabel: this.tipo.label,
      tipoMetadata: (this.tipo.metadata as Record<string, unknown> | null) ?? null,
      campoPath: this.getCampoPath(),
      campoId: this.campo?.id,
      campoSlug: this.campo?.slug,
      campoLabel: this.campo?.label,
      valor: this.valor,
      configuracao: this.configuracao,
    };
  }
}
