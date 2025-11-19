import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

const CATEGORY = CatalogCategorySlugs.PLANEJAMENTO_SQUAD_STATUS;

const ACTIVE_SLUGS = new Set(['ativo', 'active']);

export class SquadStatusVO {
  private constructor(private readonly item: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): SquadStatusVO {
    item.ensureCategory(CATEGORY);
    return new SquadStatusVO(item);
  }

  static create(props: CatalogItemProps): SquadStatusVO {
    return SquadStatusVO.fromCatalogItem(CatalogItemVO.create(props));
  }

  get id(): string {
    return this.item.id;
  }

  get slug(): string {
    return this.item.slug;
  }

  get label(): string {
    return this.item.label;
  }

  get metadata(): Record<string, unknown> | null | undefined {
    return this.item.metadata;
  }

  get legacyValue(): string | undefined {
    const meta = this.item.metadata as Record<string, unknown> | null | undefined;
    const value = meta?.legacyValue;
    return typeof value === 'string' ? value : undefined;
  }

  getValue(): string {
    return this.legacyValue ?? this.slug;
  }

  isActive(): boolean {
    const legacy = this.legacyValue?.toLowerCase();
    if (legacy) {
      return ACTIVE_SLUGS.has(legacy);
    }
    return ACTIVE_SLUGS.has(this.slug.toLowerCase());
  }

  toJSON(): CatalogItemProps {
    return this.item.toJSON();
  }
}
