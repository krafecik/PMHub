'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginWithCredentials } from '@/lib/auth-api'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve possuir ao menos 6 caracteres.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, setSession } = useAuthStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccessMessageVisible, setSuccessMessageVisible] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  // SEGURANÇA: Remover credenciais da URL imediatamente se presentes
  useEffect(() => {
    const emailParam = searchParams.get('email')
    const passwordParam = searchParams.get('password')

    if (emailParam || passwordParam) {
      // Remover credenciais da URL sem recarregar a página
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('email')
      newSearchParams.delete('password')

      const newUrl = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname

      // Usar replaceState para não adicionar ao histórico
      window.history.replaceState({}, '', newUrl)

      // Preencher o campo de email se fornecido (mas nunca a senha)
      if (emailParam) {
        setValue('email', emailParam)
      }

      // Mostrar aviso de segurança
      setErrorMessage(
        '⚠️ Por segurança, credenciais não devem ser passadas na URL. Use o formulário de login.',
      )
    }
  }, [searchParams, setValue])

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const successMessage = useMemo(() => {
    if (searchParams.get('registered') === 'true') {
      return 'Conta criada com sucesso. Faça login com a sua nova senha.'
    }
    if (searchParams.get('passwordReset') === 'true') {
      return 'Senha redefinida com sucesso. Entre novamente para continuar.'
    }
    return null
  }, [searchParams])

  useEffect(() => {
    if (successMessage) {
      setSuccessMessageVisible(true)
    }
  }, [successMessage])

  async function onSubmit(data: LoginFormValues) {
    try {
      setErrorMessage(null)
      setSuccessMessageVisible(false)
      const session = await loginWithCredentials(data.email, data.password)
      setSession(session)
      router.replace('/dashboard')
    } catch (error) {
      console.error('Erro no login:', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Falha ao realizar login. Verifique suas credenciais e tente novamente.'
      setErrorMessage(message)
      setSuccessMessageVisible(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary-100 opacity-20 blur-3xl" />
        <div className="absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent-100 opacity-20 blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Image
            src="/PMHubLogo.png"
            alt="PM Hub"
            width={120}
            height={120}
            priority
            className="mx-auto h-32 w-32 object-contain"
          />
        </div>

        <Card variant="elevated" className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
            <CardDescription>Faça login para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="h-11 pl-10"
                    error={!!errors.email}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-error-DEFAULT text-xs">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 pl-10"
                    error={!!errors.password}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-error-DEFAULT text-xs">{errors.password.message}</p>
                )}
              </div>

              {errorMessage && (
                <div className="border-error-DEFAULT bg-error-50 text-error-900 dark:bg-error-900/20 dark:border-error-800 dark:text-error-100 rounded-lg border p-3 text-sm">
                  {errorMessage}
                </div>
              )}

              {isSuccessMessageVisible && successMessage && (
                <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success-dark">
                  {successMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full"
                loading={isSubmitting}
                variant="gradient"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm">
              <div>
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="text-text-secondary">
                Possui um convite?{' '}
                <Link
                  href="/register"
                  className="font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline"
                >
                  Ative sua conta
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function LoginPageSkeleton() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary-100 opacity-20 blur-3xl" />
        <div className="absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent-100 opacity-20 blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto h-32 w-32 animate-pulse rounded-lg bg-secondary-200" />
        </div>

        <Card variant="elevated" className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="h-6 w-40 animate-pulse rounded-md bg-secondary-200" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-secondary-100" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-12 w-full animate-pulse rounded-lg bg-secondary-200" />
            <div className="h-px w-full bg-border" />
            <div className="space-y-3">
              <div className="h-11 w-full animate-pulse rounded-md bg-secondary-100" />
              <div className="h-11 w-full animate-pulse rounded-md bg-secondary-100" />
              <div className="h-11 w-full animate-pulse rounded-md bg-secondary-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
