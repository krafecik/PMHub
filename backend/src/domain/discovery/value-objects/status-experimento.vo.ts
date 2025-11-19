import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

export enum StatusExperimentoEnum {
  PLANEJADO = 'PLANEJADO',
  EM_EXECUCAO = 'EM_EXECUCAO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

const CATALOG_CATEGORY = 'status_experimento';

const SLUG_TO_ENUM: Record<string, StatusExperimentoEnum> = {
  planejado: StatusExperimentoEnum.PLANEJADO,
  em_execucao: StatusExperimentoEnum.EM_EXECUCAO,
  concluido: StatusExperimentoEnum.CONCLUIDO,
  cancelado: StatusExperimentoEnum.CANCELADO,
};

const ENUM_TO_SLUG: Record<StatusExperimentoEnum, string> = {
  [StatusExperimentoEnum.PLANEJADO]: 'planejado',
  [StatusExperimentoEnum.EM_EXECUCAO]: 'em_execucao',
  [StatusExperimentoEnum.CONCLUIDO]: 'concluido',
  [StatusExperimentoEnum.CANCELADO]: 'cancelado',
};

export class StatusExperimentoVO {
  private constructor(private readonly catalogItem: CatalogItemVO) {}

  static fromCatalogItem(item: CatalogItemVO): StatusExperimentoVO {
    item.ensureCategory(CATALOG_CATEGORY);

    if (!SLUG_TO_ENUM[item.slug]) {
      throw new Error(`Slug de status de experimento desconhecido: ${item.slug}`);
    }

    return new StatusExperimentoVO(item);
  }

  static enumToSlug(status: StatusExperimentoEnum): string {
    return ENUM_TO_SLUG[status];
  }

  getValue(): StatusExperimentoEnum {
    return SLUG_TO_ENUM[this.catalogItem.slug];
  }

  getSlug(): string {
    return this.catalogItem.slug;
  }

  getLabel(): string {
    return this.catalogItem.label;
  }

  isActive(): boolean {
    return this.getValue() === StatusExperimentoEnum.EM_EXECUCAO;
  }

  isFinal(): boolean {
    return [StatusExperimentoEnum.CONCLUIDO, StatusExperimentoEnum.CANCELADO].includes(
      this.getValue(),
    );
  }

  canStartExecution(): boolean {
    return this.getValue() === StatusExperimentoEnum.PLANEJADO;
  }

  canFinish(): boolean {
    return this.getValue() === StatusExperimentoEnum.EM_EXECUCAO;
  }

  ensureSlug(expectedSlug: string, actionDescription: string): void {
    if (this.catalogItem.slug !== expectedSlug) {
      throw new Error(
        `Status de experimento inválido para ${actionDescription}. Esperado ${expectedSlug}, recebido ${this.catalogItem.slug}`,
      );
    }
  }

  equals(other: StatusExperimentoVO): boolean {
    return this.catalogItem.equals(other.catalogItem);
  }

  toCatalogItem(): CatalogItemVO {
    return this.catalogItem;
  }
}
