'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { requestPasswordReset } from '@/lib/auth-api'
import Link from 'next/link'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
})

type ForgotPasswordForm = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: ForgotPasswordForm) => {
    try {
      setFeedback(null)
      setError(null)
      await requestPasswordReset(values.email)
      setFeedback(
        'Se o e-mail estiver cadastrado, enviaremos instruções para redefinição em instantes.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível registrar a solicitação. Tente novamente mais tarde.',
      )
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Esqueci minha senha</CardTitle>
          <CardDescription>
            Informe o e-mail utilizado no PM Hub para receber o link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com.br"
                {...register('email')}
                error={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="text-xs font-medium text-error-dark">{errors.email.message}</p>
              )}
            </div>

            {feedback && (
              <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success-dark">
                {feedback}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-error-light bg-error-light/20 p-3 text-sm text-error-dark">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
              Enviar instruções
            </Button>
          </form>

          <div className="text-center text-sm text-text-secondary">
            <Link
              href="/login"
              className="font-medium text-primary-600 transition hover:text-primary-700"
            >
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
