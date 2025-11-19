export enum TipoDemanda {
  IDEIA = 'IDEIA',
  PROBLEMA = 'PROBLEMA',
  OPORTUNIDADE = 'OPORTUNIDADE',
  OUTRO = 'OUTRO',
}

export enum OrigemDemanda {
  CLIENTE = 'CLIENTE',
  SUPORTE = 'SUPORTE',
  DIRETORIA = 'DIRETORIA',
  CS = 'CS',
  VENDAS = 'VENDAS',
  INTERNO = 'INTERNO',
}

export enum Prioridade {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export enum StatusDemanda {
  NOVO = 'NOVO',
  RASCUNHO = 'RASCUNHO',
  TRIAGEM = 'TRIAGEM',
  ARQUIVADO = 'ARQUIVADO',
}

export const tipoDemandaLabels: Record<TipoDemanda, string> = {
  [TipoDemanda.IDEIA]: 'Ideia',
  [TipoDemanda.PROBLEMA]: 'Problema',
  [TipoDemanda.OPORTUNIDADE]: 'Oportunidade',
  [TipoDemanda.OUTRO]: 'Outro',
}

export const origemDemandaLabels: Record<OrigemDemanda, string> = {
  [OrigemDemanda.CLIENTE]: 'Cliente',
  [OrigemDemanda.SUPORTE]: 'Suporte',
  [OrigemDemanda.DIRETORIA]: 'Diretoria',
  [OrigemDemanda.CS]: 'Customer Success',
  [OrigemDemanda.VENDAS]: 'Vendas',
  [OrigemDemanda.INTERNO]: 'Interno',
}

export const prioridadeLabels: Record<Prioridade, string> = {
  [Prioridade.BAIXA]: 'Baixa',
  [Prioridade.MEDIA]: 'Média',
  [Prioridade.ALTA]: 'Alta',
  [Prioridade.CRITICA]: 'Crítica',
}

export const statusDemandaLabels: Record<StatusDemanda, string> = {
  [StatusDemanda.NOVO]: 'Novo',
  [StatusDemanda.RASCUNHO]: 'Rascunho',
  [StatusDemanda.TRIAGEM]: 'Triagem',
  [StatusDemanda.ARQUIVADO]: 'Arquivado',
}

export enum StatusTriagem {
  PENDENTE_TRIAGEM = 'PENDENTE_TRIAGEM',
  AGUARDANDO_INFO = 'AGUARDANDO_INFO',
  RETOMADO_TRIAGEM = 'RETOMADO_TRIAGEM',
  PRONTO_DISCOVERY = 'PRONTO_DISCOVERY',
  ARQUIVADO = 'ARQUIVADO',
  DUPLICADO = 'DUPLICADO',
  EVOLUIU_EPICO = 'EVOLUIU_EPICO',
}
