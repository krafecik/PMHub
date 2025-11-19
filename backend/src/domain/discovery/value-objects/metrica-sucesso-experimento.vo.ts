import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'metrica_sucesso_discovery';

export class MetricaSucessoExperimentoVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): MetricaSucessoExperimentoVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new MetricaSucessoExperimentoVO(item);
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  equals(other: MetricaSucessoExperimentoVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
