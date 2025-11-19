import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

type CondicaoValor = string | string[] | number | boolean | null | undefined;

export interface CondicaoRegraProps {
  campo: CatalogItemProps;
  operador: CatalogItemProps;
  valor?: CondicaoValor;
  logica?: 'E' | 'OU';
}

export interface CondicaoRegraPersistence {
  campoId: string;
  operadorId: string;
  valor?: CondicaoValor;
  logica: 'E' | 'OU';
}

export interface CondicaoRegraDTO {
  campoId: string;
  campoSlug: string;
  campoLabel: string;
  campoMetadata: Record<string, unknown> | null;
  operadorId: string;
  operadorSlug: string;
  operadorLabel: string;
  operadorMetadata: Record<string, unknown> | null;
  valor?: CondicaoValor;
  logica: 'E' | 'OU';
}

type OperadorCodigo =
  | 'IGUAL'
  | 'DIFERENTE'
  | 'CONTEM'
  | 'NAO_CONTEM'
  | 'MAIOR_QUE'
  | 'MENOR_QUE'
  | 'MAIOR_OU_IGUAL'
  | 'MENOR_OU_IGUAL'
  | 'EM'
  | 'NAO_EM'
  | 'VAZIO'
  | 'NAO_VAZIO';

export class CondicaoRegra {
  private readonly campo: CatalogItemVO;
  private readonly operador: CatalogItemVO;
  private readonly operadorCodigo: OperadorCodigo;
  private readonly valor?: CondicaoValor;
  private readonly logica: 'E' | 'OU';

  constructor(props: CondicaoRegraProps) {
    const campoItem = CatalogItemVO.create(props.campo);
    campoItem.ensureCategory(CatalogCategorySlugs.AUTOMACAO_CAMPOS);

    const operadorItem = CatalogItemVO.create(props.operador);
    operadorItem.ensureCategory(CatalogCategorySlugs.AUTOMACAO_OPERADORES);

    const operadorCodigo = CondicaoRegra.extrairCodigoOperador(operadorItem);

    const requiresValue = CondicaoRegra.operadorRequerValor(operadorItem);
    if (requiresValue && props.valor === undefined) {
      throw new Error(`Valor é obrigatório para o operador ${operadorItem.slug}`);
    }

    this.campo = campoItem;
    this.operador = operadorItem;
    this.operadorCodigo = operadorCodigo;
    this.valor = props.valor;
    this.logica = props.logica ?? 'E';
  }

  getCampo(): CatalogItemVO {
    return this.campo;
  }

  getOperador(): CatalogItemVO {
    return this.operador;
  }

  getValor(): CondicaoValor {
    return this.valor;
  }

  getLogica(): 'E' | 'OU' {
    return this.logica;
  }

  private static extrairCodigoOperador(operador: CatalogItemVO): OperadorCodigo {
    const legacy = (operador.metadata?.legacyValue as string | undefined)?.toUpperCase();
    const slug = operador.slug.toUpperCase();
    const codigo = (legacy ?? slug) as OperadorCodigo;
    if (
      ![
        'IGUAL',
        'DIFERENTE',
        'CONTEM',
        'NAO_CONTEM',
        'MAIOR_QUE',
        'MENOR_QUE',
        'MAIOR_OU_IGUAL',
        'MENOR_OU_IGUAL',
        'EM',
        'NAO_EM',
        'VAZIO',
        'NAO_VAZIO',
      ].includes(codigo)
    ) {
      throw new Error(`Operador de automação desconhecido: ${operador.slug}`);
    }
    return codigo;
  }

  private static operadorRequerValor(operador: CatalogItemVO): boolean {
    const meta = operador.metadata as Record<string, unknown> | null;
    const requiresValue =
      typeof meta?.requiresValue === 'boolean' ? (meta.requiresValue as boolean) : true;
    return requiresValue;
  }

  private getCampoPath(): string {
    const metadata = this.campo.metadata as Record<string, unknown> | null;
    const path = typeof metadata?.path === 'string' ? (metadata.path as string) : this.campo.slug;
    return path;
  }

  private getValorContexto(contexto: Record<string, any>): unknown {
    const caminho = this.getCampoPath();
    const partes = caminho.split('.');
    let valor: any = contexto;

    for (const parte of partes) {
      if (valor && typeof valor === 'object' && parte in valor) {
        valor = valor[parte];
      } else {
        return undefined;
      }
    }

    return valor;
  }

  avaliar(contexto: Record<string, any>): boolean {
    const valorContexto = this.getValorContexto(contexto);

    switch (this.operadorCodigo) {
      case 'IGUAL':
        return valorContexto === this.valor;
      case 'DIFERENTE':
        return valorContexto !== this.valor;
      case 'CONTEM':
        return CondicaoRegra.asString(valorContexto).includes(CondicaoRegra.asString(this.valor));
      case 'NAO_CONTEM':
        return !CondicaoRegra.asString(valorContexto).includes(CondicaoRegra.asString(this.valor));
      case 'MAIOR_QUE':
        return Number(valorContexto) > Number(this.valor);
      case 'MENOR_QUE':
        return Number(valorContexto) < Number(this.valor);
      case 'MAIOR_OU_IGUAL':
        return Number(valorContexto) >= Number(this.valor);
      case 'MENOR_OU_IGUAL':
        return Number(valorContexto) <= Number(this.valor);
      case 'EM':
        return Array.isArray(this.valor) ? this.valor.includes(valorContexto as any) : false;
      case 'NAO_EM':
        return Array.isArray(this.valor) ? !this.valor.includes(valorContexto as any) : true;
      case 'VAZIO':
        return (
          valorContexto === undefined ||
          valorContexto === null ||
          (typeof valorContexto === 'string' && valorContexto.trim().length === 0) ||
          (Array.isArray(valorContexto) && valorContexto.length === 0)
        );
      case 'NAO_VAZIO':
        return !(
          valorContexto === undefined ||
          valorContexto === null ||
          (typeof valorContexto === 'string' && valorContexto.trim().length === 0) ||
          (Array.isArray(valorContexto) && valorContexto.length === 0)
        );
      default:
        return false;
    }
  }

  private static asString(valor: unknown): string {
    if (valor === undefined || valor === null) return '';
    return String(valor).toLowerCase();
  }

  toPersistence(): CondicaoRegraPersistence {
    return {
      campoId: this.campo.id,
      operadorId: this.operador.id,
      valor: this.valor,
      logica: this.logica,
    };
  }

  toDTO(): CondicaoRegraDTO {
    return {
      campoId: this.campo.id,
      campoSlug: this.campo.slug,
      campoLabel: this.campo.label,
      campoMetadata: (this.campo.metadata as Record<string, unknown> | null) ?? null,
      operadorId: this.operador.id,
      operadorSlug: this.operador.slug,
      operadorLabel: this.operador.label,
      operadorMetadata: (this.operador.metadata as Record<string, unknown> | null) ?? null,
      valor: this.valor,
      logica: this.logica,
    };
  }
}
