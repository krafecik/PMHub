import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

const CATALOG_CATEGORY = 'status_demanda';

const DEFAULT_TRANSITIONS: Record<string, string[]> = {
  novo: ['rascunho', 'triagem', 'arquivado'],
  rascunho: ['novo', 'triagem', 'arquivado'],
  triagem: ['arquivado'],
  arquivado: [],
};

export class StatusDemandaVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): StatusDemandaVO {
    item.ensureCategory(CATALOG_CATEGORY);
    return new StatusDemandaVO(item);
  }

  static create(props: CatalogItemProps): StatusDemandaVO {
    const item = CatalogItemVO.create(props);
    return StatusDemandaVO.fromCatalogItem(item);
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

  getValue(): string {
    return this.catalogItem.getLegacyValue();
  }

  getLabel(): string {
    return this.label;
  }

  private get metadata(): Record<string, unknown> | null | undefined {
    return this.catalogItem.metadata;
  }

  private getAllowedTransitions(): string[] {
    const metaTransitions =
      this.metadata && (this.metadata['allowedTransitions'] as string[] | undefined);
    if (metaTransitions && Array.isArray(metaTransitions)) {
      return metaTransitions;
    }
    return DEFAULT_TRANSITIONS[this.slug] ?? [];
  }

  private getEditableFlag(): boolean {
    const metaEditable = this.metadata && (this.metadata['isEditable'] as boolean | undefined);
    if (typeof metaEditable === 'boolean') {
      return metaEditable;
    }
    return ['novo', 'rascunho'].includes(this.slug);
  }

  private getTerminalFlag(): boolean {
    const metaTerminal = this.metadata && (this.metadata['isTerminal'] as boolean | undefined);
    if (typeof metaTerminal === 'boolean') {
      return metaTerminal;
    }
    return this.getAllowedTransitions().length === 0;
  }

  canTransitionTo(newStatus: StatusDemandaVO): boolean {
    const allowed = this.getAllowedTransitions();
    return allowed.includes(newStatus.slug);
  }

  isActive(): boolean {
    return !this.getTerminalFlag();
  }

  isEditable(): boolean {
    return this.getEditableFlag();
  }

  equals(other: StatusDemandaVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }

  toJSON(): CatalogItemProps {
    return this.catalogItem.toJSON();
  }
}
