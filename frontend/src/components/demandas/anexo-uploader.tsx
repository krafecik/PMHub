'use client'

import * as React from 'react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, File, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'

interface AnexoUploaderProps {
  demandaId: string
}

interface Anexo {
  id: string
  demandaId: string
  arquivoUrl: string
  nome: string
  tipoMime: string
  tamanho: number
  criadoPorId: string
  createdAt: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function AnexoUploader({ demandaId }: AnexoUploaderProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])

  const { data: anexos, isLoading } = useQuery({
    queryKey: ['anexos', demandaId],
    queryFn: async () => {
      try {
        return await apiFetch<Anexo[]>(`/demandas/${demandaId}/anexos`, {
          method: 'GET',
        })
      } catch (error) {
        // Se o endpoint não existir ou retornar erro, retorna array vazio
        // Isso evita quebrar a UI quando o endpoint ainda não está disponível
        console.warn('Erro ao carregar anexos:', error)
        return []
      }
    },
    retry: false,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('arquivo', file)

      return apiFetch<Anexo>(`/demandas/${demandaId}/anexos`, {
        method: 'POST',
        body: formData,
      })
    },
    onSuccess: (_, file) => {
      queryClient.invalidateQueries({ queryKey: ['anexos', demandaId] })
      toast({
        title: 'Arquivo enviado',
        description: `${file.name} foi anexado com sucesso.`,
      })
    },
    onError: (error: unknown, file: File) => {
      const message = error instanceof Error ? error.message : `Falha ao enviar ${file.name}`
      toast({
        title: 'Erro no upload',
        description: message,
        variant: 'destructive',
      })
    },
    onSettled: (_, __, file) => {
      setUploadingFiles((prev) => prev.filter((f) => f !== file.name))
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        setUploadingFiles((prev) => [...prev, file.name])
        uploadMutation.mutate(file)
      })
    },
    [uploadMutation],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all',
          isDragActive
            ? 'border-primary-600 bg-primary-50'
            : 'border-border hover:border-primary-400',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 h-12 w-12 text-text-muted" />
        {isDragActive ? (
          <p className="text-sm text-primary-700">Solte os arquivos aqui...</p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-text-primary">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-text-muted">
              PDF, imagens, documentos • Máximo 10MB por arquivo
            </p>
          </div>
        )}
      </div>

      {/* Lista de arquivos */}
      <div className="space-y-2">
        <AnimatePresence>
          {/* Arquivos sendo enviados */}
          {uploadingFiles.map((fileName) => (
            <motion.div
              key={fileName}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 rounded-lg bg-secondary-50 p-3"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              <span className="flex-1 truncate text-sm">{fileName}</span>
              <span className="text-xs text-text-muted">Enviando...</span>
            </motion.div>
          ))}

          {/* Arquivos já enviados */}
          {anexos?.map((anexo) => (
            <motion.div
              key={anexo.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center gap-3 rounded-lg bg-secondary-50 p-3"
            >
              <File className="h-4 w-4 flex-shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{anexo.nome}</p>
                <p className="text-xs text-text-muted">{formatFileSize(anexo.tamanho)}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(anexo.arquivoUrl, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Estado vazio */}
        {!isLoading && anexos?.length === 0 && uploadingFiles.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">Nenhum arquivo anexado ainda</p>
        )}
      </div>
    </div>
  )
}
