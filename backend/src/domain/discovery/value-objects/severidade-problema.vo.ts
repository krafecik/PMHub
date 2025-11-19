import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { Impacto, NivelImpactoEnum } from '../../triagem/value-objects/impacto.vo';

const CATALOG_CATEGORY = 'severidade_problema';

export class SeveridadeProblemaVO {
  private readonly impacto: Impacto;

  private constructor(
    private readonly catalogItem: CatalogItemVO,
    impacto: Impacto,
  ) {
    this.impacto = impacto;
  }

  static fromCatalogItem(item: CatalogItemVO): SeveridadeProblemaVO {
    item.ensureCategory(CATALOG_CATEGORY);

    const enumValue = SeveridadeProblemaVO.slugToImpactoEnum(item.slug);
    const impacto = new Impacto(enumValue);

    return new SeveridadeProblemaVO(item, impacto);
  }

  static slugToImpactoEnum(slug: string): NivelImpactoEnum {
    const upper = slug.toUpperCase();
    if (!Object.values(NivelImpactoEnum).includes(upper as NivelImpactoEnum)) {
      throw new Error(`Slug de severidade inválido: ${slug}`);
    }
    return upper as NivelImpactoEnum;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getImpacto(): Impacto {
    return this.impacto;
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }

  equals(other: SeveridadeProblemaVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }
}
