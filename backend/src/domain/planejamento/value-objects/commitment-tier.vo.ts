import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

const CATEGORY = CatalogCategorySlugs.PLANEJAMENTO_COMMITMENT_TIER;

export class CommitmentTierVO {
  private constructor(private readonly item: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): CommitmentTierVO {
    item.ensureCategory(CATEGORY);
    return new CommitmentTierVO(item);
  }

  static create(props: CatalogItemProps): CommitmentTierVO {
    return CommitmentTierVO.fromCatalogItem(CatalogItemVO.create(props));
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

  equals(other: CommitmentTierVO): boolean {
    return this.item.equals(other.item);
  }

  toJSON(): CatalogItemProps {
    return this.item.toJSON();
  }
}
