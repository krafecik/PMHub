import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

const CATEGORY = CatalogCategorySlugs.PLANEJAMENTO_CENARIO_STATUS;

export class CenarioStatusVO {
  private constructor(private readonly item: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): CenarioStatusVO {
    item.ensureCategory(CATEGORY);
    return new CenarioStatusVO(item);
  }

  static create(props: CatalogItemProps): CenarioStatusVO {
    return CenarioStatusVO.fromCatalogItem(CatalogItemVO.create(props));
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
    const metadata = this.item.metadata as Record<string, unknown> | null | undefined;
    const value = metadata?.legacyValue;
    return typeof value === 'string' ? value : undefined;
  }

  getValue(): string {
    return this.legacyValue ?? this.slug;
  }

  canTransitionTo(target: CenarioStatusVO): boolean {
    const metadata = this.metadata as Record<string, unknown> | null | undefined;
    const transitions = metadata?.allowedTransitions;
    if (Array.isArray(transitions) && transitions.length > 0) {
      const normalized = transitions.map((value) => value.toString().toLowerCase());
      return normalized.includes(target.slug.toLowerCase());
    }
    return true;
  }

  isTerminal(): boolean {
    const metadata = this.metadata as Record<string, unknown> | null | undefined;
    const value = metadata?.isTerminal;
    if (typeof value === 'boolean') {
      return value;
    }
    return false;
  }

  toJSON(): CatalogItemProps {
    return this.item.toJSON();
  }
}
