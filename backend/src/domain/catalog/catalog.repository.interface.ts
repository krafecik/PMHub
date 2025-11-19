import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

export const CATALOGO_REPOSITORY_TOKEN = Symbol('CATALOGO_REPOSITORY_TOKEN');

export interface CatalogItemQuery {
  tenantId: string;
  category: string;
  slug?: string;
  legacyValue?: string;
  id?: string;
}

export interface ICatalogoRepository {
  findItem(query: CatalogItemQuery): Promise<CatalogItemVO | null>;
  getRequiredItem(query: CatalogItemQuery): Promise<CatalogItemVO>;
  findItemsByIds(tenantId: string, ids: string[]): Promise<CatalogItemVO[]>;
  listItemsByCategory(tenantId: string, categorySlug: string): Promise<CatalogItemVO[]>;
}
