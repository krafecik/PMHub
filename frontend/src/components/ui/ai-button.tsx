'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface AiButtonProps extends Omit<ButtonProps, 'onClick'> {
  onGenerate: () => Promise<any>
  onSuccess?: (result: any) => void
  label?: string
  loadingLabel?: string
}

export function AiButton({
  onGenerate,
  onSuccess,
  label = 'Gerar com IA',
  loadingLabel = 'Gerando...',
  className,
  disabled,
  ...props
}: AiButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleClick() {
    setIsLoading(true)
    try {
      const result = await onGenerate()
      if (onSuccess) {
        onSuccess(result)
      }
      toast({
        title: 'Conteúdo gerado com sucesso',
        description: 'Revise e ajuste conforme necessário.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar conteúdo',
        description: error?.message ?? 'Não foi possível gerar o conteúdo automaticamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn('gap-2', className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}
