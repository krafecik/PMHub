import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

export enum StatusPesquisaEnum {
  PLANEJADA = 'PLANEJADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

const CATALOG_CATEGORY = 'status_pesquisa';

const SLUG_TO_ENUM: Record<string, StatusPesquisaEnum> = {
  planejada: StatusPesquisaEnum.PLANEJADA,
  em_andamento: StatusPesquisaEnum.EM_ANDAMENTO,
  concluida: StatusPesquisaEnum.CONCLUIDA,
  cancelada: StatusPesquisaEnum.CANCELADA,
};

const ENUM_TO_SLUG: Record<StatusPesquisaEnum, string> = {
  [StatusPesquisaEnum.PLANEJADA]: 'planejada',
  [StatusPesquisaEnum.EM_ANDAMENTO]: 'em_andamento',
  [StatusPesquisaEnum.CONCLUIDA]: 'concluida',
  [StatusPesquisaEnum.CANCELADA]: 'cancelada',
};

export class StatusPesquisaVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): StatusPesquisaVO {
    item.ensureCategory(CATALOG_CATEGORY);

    if (!SLUG_TO_ENUM[item.slug]) {
      throw new Error(`Slug de status de pesquisa desconhecido: ${item.slug}`);
    }

    return new StatusPesquisaVO(item);
  }

  static enumToSlug(status: StatusPesquisaEnum): string {
    return ENUM_TO_SLUG[status];
  }

  getValue(): StatusPesquisaEnum {
    return SLUG_TO_ENUM[this.catalogItem.slug];
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  isActive(): boolean {
    return [StatusPesquisaEnum.PLANEJADA, StatusPesquisaEnum.EM_ANDAMENTO].includes(
      this.getValue(),
    );
  }

  isFinal(): boolean {
    return [StatusPesquisaEnum.CONCLUIDA, StatusPesquisaEnum.CANCELADA].includes(this.getValue());
  }

  canAddEntrevista(): boolean {
    return this.getValue() === StatusPesquisaEnum.EM_ANDAMENTO;
  }

  ensureSlug(expectedSlug: string, actionDescription: string): void {
    if (this.catalogItem.slug !== expectedSlug) {
      throw new Error(
        `Status de pesquisa inválido para ${actionDescription}. Esperado ${expectedSlug}, recebido ${this.catalogItem.slug}`,
      );
    }
  }

  equals(other: StatusPesquisaVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
