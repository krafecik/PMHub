'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth-api'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve possuir ao menos 8 caracteres.')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
      .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
      .regex(/\d/, 'Inclua ao menos um número.')
      .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um caractere especial.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof schema>

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
          <Card className="w-full max-w-lg border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Redefinir senha</CardTitle>
              <CardDescription>Carregando dados do link de redefinição...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-text-secondary">
              Valide o link recebido por e-mail. Isso leva apenas alguns segundos.
            </CardContent>
          </Card>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  })

  const passwordValue = watch('password') ?? ''

  const passwordHints = useMemo(() => {
    const hints: string[] = []
    if (passwordValue && passwordValue.length < 12) {
      hints.push('Utilize pelo menos 12 caracteres para aumentar a segurança.')
    }
    return hints
  }, [passwordValue])

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
        <Card className="w-full max-w-lg border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Redefinir senha</CardTitle>
            <CardDescription>
              Token não informado. Solicite novamente a redefinição de senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-text-secondary">
            <p>
              Acesse{' '}
              <Link
                href="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Esqueci minha senha
              </Link>{' '}
              para solicitar um novo link.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const onSubmit = async (values: ResetForm) => {
    try {
      setErrorMessage(null)
      await resetPassword({ token, password: values.password })
      setSuccessMessage('Senha redefinida com sucesso! Você já pode acessar o PM Hub.')
      setTimeout(() => router.replace('/login?passwordReset=true'), 1500)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível redefinir a senha. Tente novamente.',
      )
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Redefinir senha</CardTitle>
          <CardDescription>Escolha uma nova senha forte para acessar o PM Hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha forte"
                {...register('password')}
                error={Boolean(errors.password)}
              />
              {errors.password && (
                <p className="text-xs font-medium text-error-dark">{errors.password.message}</p>
              )}
              {passwordHints.length > 0 && (
                <ul className="text-warning-700 space-y-1 text-xs">
                  {passwordHints.map((hint) => (
                    <li key={hint}>• {hint}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                {...register('confirmPassword')}
                error={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword && (
                <p className="text-xs font-medium text-error-dark">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-error-light bg-error-light/20 p-3 text-sm text-error-dark">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success-dark">
                {successMessage}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
              Redefinir senha
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
