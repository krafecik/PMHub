import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  compararVersoesDocumento,
  criarDocumento,
  criarDocumentoVersao,
  listarDocumentos,
  listarVersoesDocumento,
  obterDocumento,
  atualizarDocumentoCabecalho,
  atualizarDocumentoSecoes,
  type CreateDocumentoPayload,
  type CreateDocumentoVersaoPayload,
  type ListarDocumentosParams,
  type UpdateDocumentoCabecalhoPayload,
  type UpdateDocumentoSecoesPayload,
} from '@/lib/documentacao-api'
import type { CompararVersoesResponse } from '@/types/documentacao'

export function useListarDocumentos(params?: ListarDocumentosParams) {
  return useQuery({
    queryKey: ['documentacao', 'documentos', params],
    queryFn: () => listarDocumentos(params),
    staleTime: 60 * 1000,
  })
}

export function useDocumento(id?: string) {
  return useQuery({
    queryKey: ['documentacao', 'documento', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Documento id é obrigatório')
      }
      return obterDocumento(id)
    },
    enabled: Boolean(id),
  })
}

export function useVersoesDocumento(id?: string) {
  return useQuery({
    queryKey: ['documentacao', 'documento', id, 'versoes'],
    queryFn: () => {
      if (!id) {
        throw new Error('Documento id é obrigatório')
      }
      return listarVersoesDocumento(id)
    },
    enabled: Boolean(id),
  })
}

export function useCompararVersoesDocumento(
  documentoId: string | undefined,
  versaoAId: string | undefined,
  versaoBId: string | undefined,
) {
  return useQuery<CompararVersoesResponse>({
    queryKey: ['documentacao', 'documento', documentoId, 'comparar', versaoAId, versaoBId],
    queryFn: () => {
      if (!documentoId || !versaoAId || !versaoBId) {
        throw new Error('Documento e versões são obrigatórios para comparação')
      }
      return compararVersoesDocumento(documentoId, versaoAId, versaoBId)
    },
    enabled: Boolean(documentoId && versaoAId && versaoBId),
  })
}

export function useCriarDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDocumentoPayload) => criarDocumento(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentacao', 'documentos'] })
    },
  })
}

export function useAtualizarDocumentoCabecalho(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateDocumentoCabecalhoPayload) =>
      atualizarDocumentoCabecalho(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documentacao', 'documento', id] }),
        queryClient.invalidateQueries({ queryKey: ['documentacao', 'documentos'] }),
      ])
    },
  })
}

export function useAtualizarDocumentoSecoes(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateDocumentoSecoesPayload) => atualizarDocumentoSecoes(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documentacao', 'documento', id] }),
        queryClient.invalidateQueries({ queryKey: ['documentacao', 'documento', id, 'versoes'] }),
      ])
    },
  })
}

export function useCriarDocumentoVersao(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDocumentoVersaoPayload) => criarDocumentoVersao(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documentacao', 'documento', id] }),
        queryClient.invalidateQueries({ queryKey: ['documentacao', 'documento', id, 'versoes'] }),
      ])
    },
  })
}
