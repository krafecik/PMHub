import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

export enum StatusInsightEnum {
  RASCUNHO = 'RASCUNHO',
  VALIDADO = 'VALIDADO',
  REFUTADO = 'REFUTADO',
  EM_ANALISE = 'EM_ANALISE',
}

const CATALOG_CATEGORY = 'status_insight';

const SLUG_TO_ENUM: Record<string, StatusInsightEnum> = {
  rascunho: StatusInsightEnum.RASCUNHO,
  validado: StatusInsightEnum.VALIDADO,
  refutado: StatusInsightEnum.REFUTADO,
  em_analise: StatusInsightEnum.EM_ANALISE,
};

const ENUM_TO_SLUG: Record<StatusInsightEnum, string> = {
  [StatusInsightEnum.RASCUNHO]: 'rascunho',
  [StatusInsightEnum.VALIDADO]: 'validado',
  [StatusInsightEnum.REFUTADO]: 'refutado',
  [StatusInsightEnum.EM_ANALISE]: 'em_analise',
};

export class StatusInsightVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): StatusInsightVO {
    item.ensureCategory(CATALOG_CATEGORY);

    if (!SLUG_TO_ENUM[item.slug]) {
      throw new Error(`Slug de status de insight desconhecido: ${item.slug}`);
    }

    return new StatusInsightVO(item);
  }

  static enumToSlug(status: StatusInsightEnum): string {
    return ENUM_TO_SLUG[status];
  }

  getValue(): StatusInsightEnum {
    return SLUG_TO_ENUM[this.catalogItem.slug];
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  isDraft(): boolean {
    return this.getValue() === StatusInsightEnum.RASCUNHO;
  }

  isFinal(): boolean {
    return [StatusInsightEnum.VALIDADO, StatusInsightEnum.REFUTADO].includes(this.getValue());
  }

  ensureSlug(expectedSlug: string, actionDescription: string): void {
    if (this.catalogItem.slug !== expectedSlug) {
      throw new Error(
        `Status de insight inválido para ${actionDescription}. Esperado ${expectedSlug}, recebido ${this.catalogItem.slug}`,
      );
    }
  }

  equals(other: StatusInsightVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
