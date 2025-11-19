import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'prioridade_hipotese';

const DEFAULT_WEIGHTS: Record<string, number> = {
  baixa: 1,
  media: 2,
  alta: 3,
  critica: 4,
};

const DEFAULT_COLORS: Record<string, string> = {
  baixa: 'blue',
  media: 'yellow',
  alta: 'orange',
  critica: 'red',
};

export class PrioridadeHipoteseVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): PrioridadeHipoteseVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new PrioridadeHipoteseVO(item);
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

  getColor(): string {
    const metaColor = this.catalogItem.metadata?.color as string | undefined;
    return metaColor ?? DEFAULT_COLORS[this.catalogItem.slug] ?? 'gray';
  }

  isHighPriority(): boolean {
    return this.getNumericValue() >= 3;
  }

  equals(other: PrioridadeHipoteseVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
