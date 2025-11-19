import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'impacto_hipotese';

const DEFAULT_WEIGHTS: Record<string, number> = {
  baixo: 1,
  medio: 2,
  alto: 3,
  estrategico: 4,
};

export class ImpactoHipoteseVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): ImpactoHipoteseVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new ImpactoHipoteseVO(item);
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  getNumericValue(): number {
    const metaWeight = this.catalogItem.metadata?.weight as number | undefined;
    return metaWeight ?? DEFAULT_WEIGHTS[this.catalogItem.slug] ?? 1;
  }

  isHighImpact(): boolean {
    return this.getNumericValue() >= 3;
  }

  equals(other: ImpactoHipoteseVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
