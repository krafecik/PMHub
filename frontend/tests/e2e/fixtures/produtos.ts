import type { Produto } from '@/lib/products-api'

const now = new Date().toISOString()

export const produtoAtivo: Produto = {
  id: 'PROD-001',
  tenant_id: 'tenant-001',
  nome: 'Plataforma Atlas',
  descricao: 'Plataforma modular para gestão de operações.',
  status: 'ACTIVE',
  created_at: now,
  updated_at: now,
}

export const produtoInativo: Produto = {
  id: 'PROD-002',
  tenant_id: 'tenant-001',
  nome: 'CRM Legacy',
  descricao: 'Produto legado em fase de sunset.',
  status: 'INACTIVE',
  created_at: now,
  updated_at: now,
}

export function makeProduto(overrides: Partial<Produto> = {}): Produto {
  const timestamp = new Date().toISOString()

  return {
    id: overrides.id ?? `PROD-${Math.random().toString(36).slice(2, 8)}`,
    tenant_id: overrides.tenant_id ?? 'tenant-001',
    nome: overrides.nome ?? 'Produto Exemplo',
    descricao: overrides.descricao ?? 'Descrição padrão do produto.',
    status: overrides.status ?? 'ACTIVE',
    created_at: overrides.created_at ?? timestamp,
    updated_at: overrides.updated_at ?? timestamp,
  }
}

export const listaPadraoProdutos: Produto[] = [produtoAtivo, produtoInativo]

export function makeProdutosList(count = 3, options: { includeInactive?: boolean } = {}): Produto[] {
  return Array.from({ length: count }).map((_, index) =>
    makeProduto({
      nome: `Produto ${index + 1}`,
      status: options.includeInactive && index === count - 1 ? 'INACTIVE' : 'ACTIVE',
    }),
  )
}

export type ProdutoFixture = {
  id: string
  tenant_id: string
  nome: string
  descricao: string | null
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
  updated_at: string
}

export function createProdutoFixture(overrides: Partial<ProdutoFixture> = {}): ProdutoFixture {
  const now = new Date().toISOString()
  return {
    id: `PROD-${Math.random().toString(36).slice(2, 8)}`,
    tenant_id: 'tenant-001',
    nome: 'Produto Incrível',
    descricao: 'Descrição do produto para fixtures de testes E2E.',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export function cloneProdutoList(list: ProdutoFixture[]): ProdutoFixture[] {
  return list.map((produto) => ({ ...produto }))
}