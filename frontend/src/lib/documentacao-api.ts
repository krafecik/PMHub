'use client'

import { apiFetch } from './api-client'
import type {
  CompararVersoesResponse,
  Documento,
  DocumentoListItem,
  DocumentoRegraNegocio,
  DocumentoRequisitoFuncional,
  DocumentoRequisitoNaoFuncional,
  DocumentoVersao,
} from '@/types/documentacao'

export interface CreateDocumentoPayload {
  tipo: string
  titulo: string
  resumo?: string
  status?: string
  produtoId?: string
  pmId?: string
  squadId?: string
  versao?: string
  objetivo?: string
  contexto?: DocumentoVersao['contexto']
  requisitosFuncionais?: DocumentoRequisitoFuncional[]
  regrasNegocio?: DocumentoRegraNegocio[]
  requisitosNaoFuncionais?: DocumentoRequisitoNaoFuncional[]
  fluxos?: DocumentoVersao['fluxos']
  criteriosAceite?: DocumentoVersao['criteriosAceite']
  riscos?: DocumentoVersao['riscos']
}

export interface UpdateDocumentoCabecalhoPayload {
  titulo?: string
  resumo?: string
  tipo?: string
  status?: string
  produtoId?: string
  pmId?: string
  squadId?: string
}

export interface UpdateDocumentoSecoesPayload {
  objetivo?: string
  contexto?: DocumentoVersao['contexto']
  requisitosFuncionais?: DocumentoRequisitoFuncional[]
  regrasNegocio?: DocumentoRegraNegocio[]
  requisitosNaoFuncionais?: DocumentoRequisitoNaoFuncional[]
  fluxos?: DocumentoVersao['fluxos']
  criteriosAceite?: DocumentoVersao['criteriosAceite']
  riscos?: DocumentoVersao['riscos']
}

export interface CreateDocumentoVersaoPayload {
  versao: string
  objetivo?: string
  contexto?: DocumentoVersao['contexto']
  requisitosFuncionais?: DocumentoRequisitoFuncional[]
  regrasNegocio?: DocumentoRegraNegocio[]
  requisitosNaoFuncionais?: DocumentoRequisitoNaoFuncional[]
  fluxos?: DocumentoVersao['fluxos']
  criteriosAceite?: DocumentoVersao['criteriosAceite']
  riscos?: DocumentoVersao['riscos']
  changelogResumo?: string
}

export interface ListarDocumentosParams {
  termo?: string
  tipos?: string[]
  status?: string[]
  produtoId?: string
  pmId?: string
  squadId?: string
  tags?: string[]
  page?: number
  pageSize?: number
}

export interface ListarDocumentosResponse {
  total: number
  page: number
  pageSize: number
  itens: DocumentoListItem[]
}

export async function criarDocumento(
  payload: CreateDocumentoPayload,
): Promise<{ id: string; message: string }> {
  return apiFetch<{ id: string; message: string }>('/documentacao', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listarDocumentos(
  params?: ListarDocumentosParams,
): Promise<ListarDocumentosResponse> {
  const searchParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }

      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item))
      } else {
        searchParams.append(key, String(value))
      }
    })
  }

  const queryString = searchParams.toString()
  const url = queryString ? `/documentacao?${queryString}` : '/documentacao'

  return apiFetch<ListarDocumentosResponse>(url)
}

export async function obterDocumento(id: string): Promise<Documento> {
  return apiFetch<Documento>(`/documentacao/${id}`)
}

export async function atualizarDocumentoCabecalho(
  id: string,
  payload: UpdateDocumentoCabecalhoPayload,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/documentacao/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function atualizarDocumentoSecoes(
  id: string,
  payload: UpdateDocumentoSecoesPayload,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/documentacao/${id}/secoes`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function criarDocumentoVersao(
  id: string,
  payload: CreateDocumentoVersaoPayload,
): Promise<{ id: string; message: string }> {
  return apiFetch<{ id: string; message: string }>(`/documentacao/${id}/versoes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listarVersoesDocumento(id: string): Promise<DocumentoVersao[]> {
  return apiFetch<DocumentoVersao[]>(`/documentacao/${id}/versoes`)
}

export async function compararVersoesDocumento(
  documentoId: string,
  versaoAId: string,
  versaoBId: string,
): Promise<CompararVersoesResponse> {
  const params = new URLSearchParams({
    versaoAId,
    versaoBId,
  })

  return apiFetch<CompararVersoesResponse>(
    `/documentacao/${documentoId}/versoes/compare?${params.toString()}`,
  )
}

export async function verificarStatusModulo(): Promise<{ module: string; ready: boolean }> {
  return apiFetch<{ module: string; ready: boolean }>(`/documentacao/status`)
}

// AI Functions
export interface PrdDraftResponse {
  objetivo: string
  contexto: string
  escopoFuncional: string[]
  requisitosNaoFuncionais: string[]
  regrasNegocio: string[]
  fluxos: string[]
  criteriosAceite: string[]
  riscos: string[]
}

export interface RegrasNegocioResponse {
  regras: Array<{
    codigo: string
    descricao: string
    tipo: string
  }>
}

export interface ConsistenciaResponse {
  inconsistencias: Array<{
    descricao: string
    severidade: 'ALTA' | 'MEDIA' | 'BAIXO'
    impacto: string
  }>
}

export interface CenariosResponse {
  cenarios: Array<{
    titulo: string
    persona: string
    narrativa: string
  }>
}

export interface GherkinResponse {
  cenarios: Array<{
    titulo: string
    steps: string[]
  }>
}

export interface ReleaseNotesResponse {
  novidades: string[]
  melhorias: string[]
  notasTecnicas: string[]
}

export async function gerarPrdDraft(documentoId: string): Promise<PrdDraftResponse> {
  return apiFetch<PrdDraftResponse>(`/documentacao/${documentoId}/gerar-prd-draft`, {
    method: 'POST',
  })
}

export async function sugerirRegrasNegocio(documentoId: string): Promise<RegrasNegocioResponse> {
  return apiFetch<RegrasNegocioResponse>(`/documentacao/${documentoId}/sugerir-regras-negocio`, {
    method: 'POST',
  })
}

export async function verificarConsistencia(documentoId: string): Promise<ConsistenciaResponse> {
  return apiFetch<ConsistenciaResponse>(`/documentacao/${documentoId}/verificar-consistencia`, {
    method: 'POST',
  })
}

export async function gerarCenarios(documentoId: string): Promise<CenariosResponse> {
  return apiFetch<CenariosResponse>(`/documentacao/${documentoId}/gerar-cenarios`, {
    method: 'POST',
  })
}

export async function gerarCenariosGherkin(documentoId: string): Promise<GherkinResponse> {
  return apiFetch<GherkinResponse>(`/documentacao/${documentoId}/gerar-cenarios-gherkin`, {
    method: 'POST',
  })
}

export async function gerarReleaseNotes(
  documentoId: string,
  releaseNome: string,
): Promise<ReleaseNotesResponse> {
  return apiFetch<ReleaseNotesResponse>(`/documentacao/${documentoId}/gerar-release-notes`, {
    method: 'POST',
    body: JSON.stringify({ releaseNome }),
  })
}
