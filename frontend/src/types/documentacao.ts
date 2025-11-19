export interface DocumentoContexto {
  problema?: string
  dados?: string
  personas?: string
}

export interface DocumentoRequisitoFuncional {
  id?: string
  codigo: string
  descricao: string
  prioridade?: string
}

export interface DocumentoRegraNegocio {
  id?: string
  codigo: string
  titulo: string
  descricao?: string
  tipo: string
  origem: string
  impacto: string
  modulo?: string
}

export interface DocumentoRequisitoNaoFuncional {
  id?: string
  categoria: string
  descricao: string
  metrica?: string
}

export interface DocumentoFluxo {
  diagramaUrl?: string
  descricao?: string
}

export interface DocumentoCriterioAceite {
  id?: string
  codigo?: string
  descricao: string
  cenario?: string
}

export interface DocumentoRisco {
  id?: string
  descricao: string
  probabilidade: string
  impacto: string
  mitigacao?: string
}

export interface DocumentoVersao {
  id?: string
  documentoId: string
  tenantId: string
  versao: string
  objetivo?: string
  contexto?: DocumentoContexto
  requisitosFuncionais: DocumentoRequisitoFuncional[]
  regrasNegocio: DocumentoRegraNegocio[]
  requisitosNaoFuncionais: DocumentoRequisitoNaoFuncional[]
  fluxos?: DocumentoFluxo
  criteriosAceite: DocumentoCriterioAceite[]
  riscos: DocumentoRisco[]
  changelogResumo?: string
  conteudoJson?: Record<string, unknown>
  createdAt?: string
  createdBy?: string
}

export interface Documento {
  id: string
  tenantId: string
  tipo: string
  titulo: string
  resumo?: string
  status: string
  produtoId?: string
  pmId?: string
  squadId?: string
  versaoAtual?: DocumentoVersao
  versoes: DocumentoVersao[]
  createdAt?: string
  updatedAt?: string
}

export interface DocumentoListItem extends Documento {}

export interface CompararVersoesResponse {
  versaoA: DocumentoVersao
  versaoB: DocumentoVersao
}

export interface DocumentoVinculo {
  id: string
  tipoAlvo: string
  idAlvo: string
  descricao?: string
  createdAt?: string
}

export interface DocumentoComentario {
  id: string
  usuarioId: string
  texto: string
  tipo: 'comentario' | 'sugestao' | 'bloqueador' | 'aprovacao'
  resolvido: boolean
  createdAt?: string
  respostas?: DocumentoComentario[]
}
