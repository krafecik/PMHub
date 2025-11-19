import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

const CATEGORY = CatalogCategorySlugs.PLANNING_CYCLE_STATUS;

export class PlanningCycleStatusVO {
  private constructor(private readonly item: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): PlanningCycleStatusVO {
    item.ensureCategory(CATEGORY);
    return new PlanningCycleStatusVO(item);
  }

  static create(props: CatalogItemProps): PlanningCycleStatusVO {
    return PlanningCycleStatusVO.fromCatalogItem(CatalogItemVO.create(props));
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

  isClosed(): boolean {
    const meta = this.metadata ?? {};
    const isTerminal =
      typeof meta['isTerminal'] === 'boolean' ? (meta['isTerminal'] as boolean) : undefined;
    if (typeof isTerminal === 'boolean') {
      return isTerminal;
    }
    return this.slug === 'closed';
  }

  equals(other: PlanningCycleStatusVO): boolean {
    return this.item.equals(other.item);
  }

  toJSON(): CatalogItemProps {
    return this.item.toJSON();
  }
}
