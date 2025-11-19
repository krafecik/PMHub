import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

export enum StatusHipoteseEnum {
  PENDENTE = 'PENDENTE',
  EM_TESTE = 'EM_TESTE',
  VALIDADA = 'VALIDADA',
  REFUTADA = 'REFUTADA',
  ARQUIVADA = 'ARQUIVADA',
}

const CATALOG_CATEGORY = 'status_hipotese';

const SLUG_TO_ENUM: Record<string, StatusHipoteseEnum> = {
  pendente: StatusHipoteseEnum.PENDENTE,
  em_teste: StatusHipoteseEnum.EM_TESTE,
  validada: StatusHipoteseEnum.VALIDADA,
  refutada: StatusHipoteseEnum.REFUTADA,
  arquivada: StatusHipoteseEnum.ARQUIVADA,
};

const ENUM_TO_SLUG: Record<StatusHipoteseEnum, string> = {
  [StatusHipoteseEnum.PENDENTE]: 'pendente',
  [StatusHipoteseEnum.EM_TESTE]: 'em_teste',
  [StatusHipoteseEnum.VALIDADA]: 'validada',
  [StatusHipoteseEnum.REFUTADA]: 'refutada',
  [StatusHipoteseEnum.ARQUIVADA]: 'arquivada',
};

export class StatusHipoteseVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): StatusHipoteseVO {
    item.ensureCategory(CATALOG_CATEGORY);

    const enumValue = SLUG_TO_ENUM[item.slug];
    if (!enumValue) {
      throw new Error(`Slug de status de hipótese desconhecido: ${item.slug}`);
    }

    return new StatusHipoteseVO(item);
  }

  static fromEnum(enumValue: StatusHipoteseEnum, catalogItem: CatalogItemVO): StatusHipoteseVO {
    const expectedSlug = StatusHipoteseVO.enumToSlug(enumValue);
    if (catalogItem.slug !== expectedSlug) {
      throw new Error(
        `Slug (${catalogItem.slug}) não corresponde ao enum informado (${enumValue})`,
      );
    }

    return StatusHipoteseVO.fromCatalogItem(catalogItem);
  }

  static enumFromSlug(slug: string): StatusHipoteseEnum {
    const enumValue = SLUG_TO_ENUM[slug];
    if (!enumValue) {
      throw new Error(`Slug de status de hipótese desconhecido: ${slug}`);
    }
    return enumValue;
  }

  static enumToSlug(value: StatusHipoteseEnum): string {
    return ENUM_TO_SLUG[value];
  }

  getValue(): StatusHipoteseEnum {
    return StatusHipoteseVO.enumFromSlug(this.catalogItem.slug);
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  isActive(): boolean {
    return [StatusHipoteseEnum.PENDENTE, StatusHipoteseEnum.EM_TESTE].includes(this.getValue());
  }

  isFinal(): boolean {
    return [
      StatusHipoteseEnum.VALIDADA,
      StatusHipoteseEnum.REFUTADA,
      StatusHipoteseEnum.ARQUIVADA,
    ].includes(this.getValue());
  }

  isSuccess(): boolean {
    return this.getValue() === StatusHipoteseEnum.VALIDADA;
  }

  ensureSlug(expectedSlug: string, actionDescription: string): void {
    if (this.catalogItem.slug !== expectedSlug) {
      throw new Error(
        `Status de hipótese inválido para ${actionDescription}. Esperado ${expectedSlug}, recebido ${this.catalogItem.slug}`,
      );
    }
  }

  equals(other: StatusHipoteseVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
