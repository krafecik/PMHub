import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'impacto_insight';

const DEFAULT_WEIGHTS: Record<string, number> = {
  baixo: 1,
  medio: 2,
  alto: 3,
  critico: 4,
};

export class ImpactoInsightVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): ImpactoInsightVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new ImpactoInsightVO(item);
  }

  getValue(): string {
    return this.catalogItem.getLegacyValue();
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  getScore(): number {
    const metaWeight = this.catalogItem.metadata?.weight as number | undefined;
    return metaWeight ?? DEFAULT_WEIGHTS[this.catalogItem.slug] ?? 1;
  }

  isHighImpact(): boolean {
    return this.getScore() >= 3;
  }

  equals(other: ImpactoInsightVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
