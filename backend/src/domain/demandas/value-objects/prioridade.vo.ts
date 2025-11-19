import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'prioridade_nivel';

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

export class PrioridadeVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): PrioridadeVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new PrioridadeVO(item);
  }

  static create(props: CatalogItemProps): PrioridadeVO {
    const item = CatalogItemVO.create(props);
    return PrioridadeVO.fromCatalogItem(item);
  }

  static default(prioridadeCatalog?: CatalogItemVO): PrioridadeVO {
    if (prioridadeCatalog) {
      return PrioridadeVO.fromCatalogItem(prioridadeCatalog);
    }
    throw new Error('Prioridade padrão requer item de catálogo explicitado');
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

  private get metadata(): Record<string, unknown> | null | undefined {
    return this.catalogItem.metadata;
  }

  getColor(): string {
    const metaColor = this.metadata && (this.metadata['color'] as string | undefined);
    return metaColor ?? DEFAULT_COLORS[this.slug] ?? 'gray';
  }

  getValue(): string {
    return this.catalogItem.getLegacyValue();
  }

  getLabel(): string {
    return this.label;
  }

  getNumericValue(): number {
    const metaWeight = this.metadata && (this.metadata['weight'] as number | undefined);
    return metaWeight ?? DEFAULT_WEIGHTS[this.slug] ?? 1;
  }

  isHighPriority(): boolean {
    return this.getNumericValue() >= 3;
  }

  compareTo(other: PrioridadeVO): number {
    return this.getNumericValue() - other.getNumericValue();
  }

  equals(other: PrioridadeVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }

  toJSON(): CatalogItemProps {
    return this.catalogItem.toJSON();
  }
}

export type Prioridade = string;
