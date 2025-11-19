import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'tipo_demanda';

export class TipoDemandaVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): TipoDemandaVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new TipoDemandaVO(item);
  }

  static create(props: CatalogItemProps): TipoDemandaVO {
    const item = CatalogItemVO.create(props);
    return TipoDemandaVO.fromCatalogItem(item);
  }

  get id(): string {
    return this.catalogItem.id;
  }

  get slug(): string {
    return this.catalogItem.slug;
  }

  get label(): string {
    return this.catalogItem.label;
  }

  get metadata(): Record<string, unknown> | null | undefined {
    return this.catalogItem.metadata;
  }

  getValue(): string {
    return this.catalogItem.getLegacyValue();
  }

  getLabel(): string {
    return this.label;
  }

  equals(other: TipoDemandaVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }

  toJSON(): CatalogItemProps {
    return this.catalogItem.toJSON();
  }
}
