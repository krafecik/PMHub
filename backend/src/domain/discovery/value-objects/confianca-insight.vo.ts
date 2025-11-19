import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'confianca_insight';

const DEFAULT_SCORES: Record<string, number> = {
  baixa: 1,
  media: 2,
  alta: 3,
  muito_alta: 4,
};

export class ConfiancaInsightVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): ConfiancaInsightVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new ConfiancaInsightVO(item);
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
    const metadataScore = this.catalogItem.metadata?.score as number | undefined;
    return metadataScore ?? DEFAULT_SCORES[this.catalogItem.slug] ?? 1;
  }

  equals(other: ConfiancaInsightVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
