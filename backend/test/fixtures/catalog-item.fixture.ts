import { CatalogItemProps, CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';

type CatalogDefaults = {
  categorySlug: string;
  slug: string;
  label: string;
  metadata?: Record<string, unknown>;
};

const mergeMetadata = (
  defaults: Record<string, unknown> | undefined,
  overrides: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null => {
  if (!defaults && !overrides) {
    return {};
  }

  return {
    ...(defaults ?? {}),
    ...((overrides ?? {}) as Record<string, unknown>),
  };
};

const buildCatalogItemProps = (
  defaults: CatalogDefaults,
  overrides: Partial<CatalogItemProps> = {},
): CatalogItemProps => ({
  id: overrides.id ?? `catalog-${defaults.categorySlug}-${defaults.slug}`,
  tenantId: overrides.tenantId ?? 'tenant-01',
  categorySlug: overrides.categorySlug ?? defaults.categorySlug,
  slug: overrides.slug ?? defaults.slug,
  label: overrides.label ?? defaults.label,
  ordem: overrides.ordem ?? 1,
  ativo: overrides.ativo ?? true,
  metadata: mergeMetadata(defaults.metadata, overrides.metadata),
  produtoId: overrides.produtoId ?? null,
});

export const createCatalogItem = (
  defaults: CatalogDefaults,
  overrides: Partial<CatalogItemProps> = {},
): CatalogItemVO => CatalogItemVO.create(buildCatalogItemProps(defaults, overrides));

export const createPrioridadeAlta = (overrides: Partial<CatalogItemProps> = {}): CatalogItemVO =>
  createCatalogItem(
    {
      categorySlug: 'prioridade_nivel',
      slug: 'alta',
      label: 'Alta',
      metadata: { weight: 3, color: 'orange' },
    },
    overrides,
  );

export const createPrioridadeCritica = (overrides: Partial<CatalogItemProps> = {}): CatalogItemVO =>
  createCatalogItem(
    {
      categorySlug: 'prioridade_nivel',
      slug: 'critica',
      label: 'Crítica',
      metadata: { weight: 4, color: 'red' },
    },
    overrides,
  );

export const createStatusDemanda = (
  slug: 'novo' | 'rascunho' | 'triagem' | 'arquivado' = 'novo',
  overrides: Partial<CatalogItemProps> = {},
): CatalogItemVO =>
  createCatalogItem(
    {
      categorySlug: 'status_demanda',
      slug,
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
      metadata:
        slug === 'novo'
          ? { allowedTransitions: ['rascunho', 'triagem', 'arquivado'], isEditable: true }
          : undefined,
    },
    overrides,
  );

export const createTipoDemanda = (
  slug: 'feature' | 'bug' | 'ajuste' = 'feature',
  overrides: Partial<CatalogItemProps> = {},
): CatalogItemVO =>
  createCatalogItem(
    {
      categorySlug: 'tipo_demanda',
      slug,
      label: slug === 'feature' ? 'Feature' : slug === 'bug' ? 'Bug' : 'Ajuste',
    },
    overrides,
  );

export const createOrigemDemanda = (
  slug: 'cliente' | 'interno' | 'suporte' = 'interno',
  overrides: Partial<CatalogItemProps> = {},
): CatalogItemVO =>
  createCatalogItem(
    {
      categorySlug: 'origem_demanda',
      slug,
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
    },
    overrides,
  );
