export interface CatalogItemProps {
  id: string;
  tenantId: string;
  categorySlug: string;
  slug: string;
  label: string;
  ordem?: number;
  ativo: boolean;
  metadata?: Record<string, unknown> | null;
  produtoId?: string | null;
}

export class CatalogItemVO {
  private constructor(private readonly props: CatalogItemProps) {}

  static create(props: CatalogItemProps): CatalogItemVO {
    if (!props.id) throw new Error('Catalog item must have an id');
    if (!props.tenantId) throw new Error('Catalog item must include tenant id');
    if (!props.categorySlug) throw new Error('Catalog item must include category slug');
    if (!props.slug) throw new Error('Catalog item must include slug');
    if (!props.label) throw new Error('Catalog item must include label');

    return new CatalogItemVO({
      ...props,
      metadata: props.metadata ?? null,
      produtoId: props.produtoId ?? null,
    });
  }

  ensureCategory(expectedCategory: string): void {
    if (this.props.categorySlug !== expectedCategory) {
      throw new Error(
        `Catalog item category mismatch. Expected ${expectedCategory}, received ${this.props.categorySlug}.`,
      );
    }
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get categorySlug(): string {
    return this.props.categorySlug;
  }

  get slug(): string {
    return this.props.slug;
  }

  getSlug(): string {
    return this.props.slug;
  }

  get label(): string {
    return this.props.label;
  }

  getLabel(): string {
    return this.props.label;
  }

  get ordem(): number | undefined {
    return this.props.ordem;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get metadata(): Record<string, unknown> | null | undefined {
    return this.props.metadata;
  }

  get produtoId(): string | null | undefined {
    return this.props.produtoId;
  }

  getLegacyValue(): string {
    const legacyValue = this.getMetadataString('legacyValue');
    return legacyValue ?? this.slug.toUpperCase();
  }

  toPrimitive(): string {
    return this.getLegacyValue();
  }

  equals(other: CatalogItemVO): boolean {
    return this.props.id === other.id && this.props.tenantId === other.tenantId;
  }

  toJSON(): CatalogItemProps {
    return { ...this.props };
  }

  private getMetadataString(key: string): string | undefined {
    const metadata = this.props.metadata;
    if (!metadata || typeof metadata !== 'object') {
      return undefined;
    }

    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
}
