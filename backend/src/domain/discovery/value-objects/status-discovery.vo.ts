import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

export enum StatusDiscoveryEnum {
  EM_PESQUISA = 'EM_PESQUISA',
  VALIDANDO = 'VALIDANDO',
  FECHADO = 'FECHADO',
  CANCELADO = 'CANCELADO',
}

const CATALOG_CATEGORY = 'status_discovery';

const SLUG_TO_ENUM: Record<string, StatusDiscoveryEnum> = {
  em_pesquisa: StatusDiscoveryEnum.EM_PESQUISA,
  validando: StatusDiscoveryEnum.VALIDANDO,
  fechado: StatusDiscoveryEnum.FECHADO,
  cancelado: StatusDiscoveryEnum.CANCELADO,
};

const ENUM_TO_SLUG: Record<StatusDiscoveryEnum, string> = {
  [StatusDiscoveryEnum.EM_PESQUISA]: 'em_pesquisa',
  [StatusDiscoveryEnum.VALIDANDO]: 'validando',
  [StatusDiscoveryEnum.FECHADO]: 'fechado',
  [StatusDiscoveryEnum.CANCELADO]: 'cancelado',
};

export class StatusDiscoveryVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): StatusDiscoveryVO {
    item.ensureCategory(CATALOG_CATEGORY);

    const enumValue = SLUG_TO_ENUM[item.slug];
    if (!enumValue) {
      throw new Error(`Slug de status de discovery desconhecido: ${item.slug}`);
    }

    return new StatusDiscoveryVO(item);
  }

  static fromEnum(enumValue: StatusDiscoveryEnum, catalogItem: CatalogItemVO): StatusDiscoveryVO {
    if (StatusDiscoveryVO.enumToSlug(enumValue) !== catalogItem.slug) {
      throw new Error(
        `Slug (${catalogItem.slug}) não corresponde ao enum informado (${enumValue})`,
      );
    }
    return StatusDiscoveryVO.fromCatalogItem(catalogItem);
  }

  static enumFromSlug(slug: string): StatusDiscoveryEnum {
    const enumValue = SLUG_TO_ENUM[slug];
    if (!enumValue) {
      throw new Error(`Slug de status de discovery desconhecido: ${slug}`);
    }
    return enumValue;
  }

  static enumToSlug(value: StatusDiscoveryEnum): string {
    return ENUM_TO_SLUG[value];
  }

  getValue(): StatusDiscoveryEnum {
    return StatusDiscoveryVO.enumFromSlug(this.catalogItem.slug);
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  isActive(): boolean {
    const metadata = this.catalogItem.metadata ?? {};
    if (typeof metadata?.isActive === 'boolean') {
      return metadata.isActive;
    }
    return !this.isFinal();
  }

  isFinal(): boolean {
    const metadata = this.catalogItem.metadata ?? {};
    if (typeof metadata?.isFinal === 'boolean') {
      return metadata.isFinal;
    }

    const enumValue = this.getValue();
    return [StatusDiscoveryEnum.FECHADO, StatusDiscoveryEnum.CANCELADO].includes(enumValue);
  }

  equals(other: StatusDiscoveryVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
