import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'origem_demanda';

export class OrigemDemandaVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): OrigemDemandaVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new OrigemDemandaVO(item);
  }

  static create(props: CatalogItemProps): OrigemDemandaVO {
    const item = CatalogItemVO.create(props);
    return OrigemDemandaVO.fromCatalogItem(item);
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

  isExternal(): boolean {
    const externalSlugs = new Set(['cliente', 'suporte']);
    return externalSlugs.has(this.slug);
  }

  equals(other: OrigemDemandaVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }

  toJSON(): CatalogItemProps {
    return this.catalogItem.toJSON();
  }
}
