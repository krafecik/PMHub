export type DemandaFixture = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  tipoLabel: string
  produtoId: string
  produtoNome: string
  origem: string
  origemLabel: string
  prioridade: string
  prioridadeLabel: string
  prioridadeColor: string
  status: string
  statusLabel: string
  responsavelId?: string
  criadoPorId: string
  createdAt: string
  updatedAt: string
  comentariosCount?: number
  anexosCount?: number
}

export type DemandaDetalheFixture = DemandaFixture & {
  origemDetalhe?: string
  prioridadeColor: string
  criadoPorNome?: string
  motivoCancelamento?: string | null
  tags: Array<{ id: string; nome: string }>
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function createDemandaFixture(overrides: Partial<DemandaFixture> = {}): DemandaFixture {
  const now = new Date().toISOString()
  return {
    id: overrides.id ?? randomId('DEM'),
    titulo: overrides.titulo ?? 'Demanda de melhoria nos relatórios',
    descricao:
      overrides.descricao ??
      'Precisamos aprimorar os relatórios de resultado para incluir filtros por produto e período.',
    tipo: overrides.tipo ?? 'IDEIA',
    tipoLabel: overrides.tipoLabel ?? 'Ideia',
    produtoId: overrides.produtoId ?? 'PROD-001',
    produtoNome: overrides.produtoNome ?? 'Plataforma Atlas',
    origem: overrides.origem ?? 'CLIENTE',
    origemLabel: overrides.origemLabel ?? 'Cliente',
    prioridade: overrides.prioridade ?? 'ALTA',
    prioridadeLabel: overrides.prioridadeLabel ?? 'Alta',
    prioridadeColor: overrides.prioridadeColor ?? '#f97316',
    status: overrides.status ?? 'NOVO',
    statusLabel: overrides.statusLabel ?? 'Novo',
    responsavelId: overrides.responsavelId,
    criadoPorId: overrides.criadoPorId ?? 'usr-001',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    comentariosCount: overrides.comentariosCount ?? 0,
    anexosCount: overrides.anexosCount ?? 0,
  }
}

export function createDemandaDetalheFixture(
  overrides: Partial<DemandaDetalheFixture> = {},
): DemandaDetalheFixture {
  const base = createDemandaFixture(overrides)
  return {
    ...base,
    origemDetalhe: overrides.origemDetalhe ?? 'Feedback recebido durante call trimestral',
    prioridadeColor: overrides.prioridadeColor ?? base.prioridadeColor,
    criadoPorNome: overrides.criadoPorNome ?? 'Ana PM',
    motivoCancelamento: overrides.motivoCancelamento ?? null,
    tags: overrides.tags ?? [
      { id: randomId('TAG'), nome: 'Experiência do Cliente' },
      { id: randomId('TAG'), nome: 'Insights' },
    ],
  }
}
