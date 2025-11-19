import { CatalogItemVO } from '../catalog-item.vo';
import { ProductId } from '../product-id.vo';
import { TenantId } from '../tenant-id.vo';
import { UserId } from '../user-id.vo';
import { createCatalogItem } from '../../../../../test/fixtures';

describe('CatalogItemVO', () => {
  const baseProps = {
    categorySlug: 'catalogo_generico',
    slug: 'item_teste',
    label: 'Item de Teste',
  };

  it('cria item de catálogo válido e expõe propriedades', () => {
    const item = createCatalogItem(baseProps);

    expect(item.id).toMatch(/catalogo_generico-item_teste/);
    expect(item.tenantId).toBe('tenant-01');
    expect(item.categorySlug).toBe(baseProps.categorySlug);
    expect(item.slug).toBe(baseProps.slug);
    expect(item.label).toBe(baseProps.label);
    expect(item.metadata).toEqual({});
    expect(item.produtoId).toBeNull();
  });

  it('lança erro quando campos obrigatórios estão ausentes', () => {
    expect(() =>
      CatalogItemVO.create({
        // @ts-expect-error Testando ausência de campos
        id: '',
        tenantId: '',
        categorySlug: '',
        slug: '',
        label: '',
        ativo: true,
      }),
    ).toThrow('Catalog item must have an id');
  });

  it('garante categoria esperada e lança erro quando diferente', () => {
    const item = createCatalogItem(baseProps);
    expect(() => item.ensureCategory('catalogo_generico')).not.toThrow();
    expect(() => item.ensureCategory('outra_categoria')).toThrow(
      'Catalog item category mismatch. Expected outra_categoria, received catalogo_generico.',
    );
  });

  it('usa legacyValue do metadata ou slug em maiúsculo como valor primitivo', () => {
    const withLegacy = createCatalogItem({
      ...baseProps,
      metadata: { legacyValue: 'valor_legacy' },
    });
    expect(withLegacy.getLegacyValue()).toBe('valor_legacy');
    expect(withLegacy.toPrimitive()).toBe('valor_legacy');

    const withoutLegacy = createCatalogItem({ ...baseProps, slug: 'custom', metadata: {} });
    expect(withoutLegacy.getLegacyValue()).toBe('CUSTOM');
  });

  it('compara igualdade pelo id e tenant', () => {
    const base = createCatalogItem(baseProps);
    const same = createCatalogItem(baseProps, {
      id: base.id,
      tenantId: base.tenantId,
    });
    const different = createCatalogItem(baseProps, {
      id: 'outro-id',
      tenantId: 'tenant-02',
    });

    expect(base.equals(same)).toBe(true);
    expect(base.equals(different)).toBe(false);
  });

  it('serializa dados para JSON preservando campos opcionais', () => {
    const item = createCatalogItem(baseProps, {
      produtoId: 'produto-99',
      metadata: { qualquer: 'valor' },
    });

    expect(item.toJSON()).toMatchObject({
      id: item.id,
      tenantId: item.tenantId,
      categorySlug: item.categorySlug,
      slug: item.slug,
      label: item.label,
      metadata: { qualquer: 'valor' },
      produtoId: 'produto-99',
    });
  });
});

describe.each([
  {
    name: 'ProductId',
    factory: (value?: string) => new ProductId(value ?? 'prod-123'),
    errorMessage: 'ProductId não pode ser vazio',
  },
  {
    name: 'TenantId',
    factory: (value?: string) => new TenantId(value ?? 'tenant-123'),
    errorMessage: 'TenantId não pode ser vazio',
  },
  {
    name: 'UserId',
    factory: (value?: string) => new UserId(value ?? 'user-123'),
    errorMessage: 'UserId não pode ser vazio',
  },
])('$name', ({ factory, errorMessage }) => {
  it('não permite valor vazio', () => {
    expect(() => factory('')).toThrow(errorMessage);
    expect(() => factory('   ')).toThrow(errorMessage);
  });

  it('expõe valor e compara igualdade corretamente', () => {
    const first = factory('valor-1');
    const same = factory('valor-1');
    const different = factory('valor-2');

    expect(first.getValue()).toBe('valor-1');
    expect(first.equals(same)).toBe(true);
    expect(first.equals(different)).toBe(false);
  });
});

