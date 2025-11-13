'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { completeAzureCallback, loginWithAzure, loginWithCredentials } from '@/lib/auth-api'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Building2, Lock, Mail, ArrowRight, Sparkles, Shield, CheckCircle } from 'lucide-react'

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
  const [isAzureLoading, setIsAzureLoading] = useState(false)
  const [isCallbackHandled, setIsCallbackHandled] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state || isCallbackHandled) {
      return
    }

    setIsCallbackHandled(true)
    setErrorMessage(null)

    const params = new URLSearchParams({
      code,
      state,
    })

    completeAzureCallback(params)
      .then((session) => {
        setSession(session)
        router.replace('/dashboard')
      })
      .catch(() => {
        setErrorMessage('Não foi possível concluir o login via Azure AD.')
      })
  }, [searchParams, router, setSession, isCallbackHandled])

  async function handleAzureLogin() {
    try {
      setIsAzureLoading(true)
      setErrorMessage(null)
      const response = await loginWithAzure()
      window.location.href = response.authorizationUrl
    } catch (error) {
      setErrorMessage('Não foi possível iniciar o login via Azure AD.')
    } finally {
      setIsAzureLoading(false)
    }
  }

  async function onSubmit(data: LoginFormValues) {
    try {
      setErrorMessage(null)
      const session = await loginWithCredentials(data.email, data.password)
      setSession(session)
      router.replace('/dashboard')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao realizar login. Tente novamente.',
      )
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary-100 opacity-20 blur-3xl" />
        <div className="absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent-100 opacity-20 blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-lg px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
            <span className="text-2xl font-bold">C</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">CPOPM Hub</h1>
          <p className="mt-2 text-text-secondary">Sistema de gestão de produto para CPOs e PMs</p>
        </div>

        <Card variant="elevated" className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
            <CardDescription>Faça login para acessar o painel de ProductOps</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={handleAzureLogin}
              disabled={isAzureLoading}
              className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              <Building2 className="mr-2 h-5 w-5" />
              {isAzureLoading ? 'Redirecionando...' : 'Entrar com Azure AD'}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-text-muted">ou</span>
              </div>
            </div>

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
                <div className="rounded-lg border border-error-light bg-error-light/20 p-3 text-sm text-error-dark">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full"
                loading={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar como administrador'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-8 rounded-lg bg-secondary-50 p-4">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-5 w-5 shrink-0 text-primary-600" />
                <p className="text-text-secondary">
                  Login administrativo apenas para usuários autorizados. Use Azure AD para login
                  corporativo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-text-secondary">Gestão Ágil</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-text-secondary">Validações</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-success-light/20 text-success-dark">
              <Shield className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-text-secondary">Segurança</p>
          </div>
        </div>
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

      <div className="z-10 w-full max-w-lg px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-2xl bg-secondary-200" />
          <div className="mx-auto h-8 w-32 animate-pulse rounded-md bg-secondary-200" />
          <div className="mx-auto mt-2 h-4 w-48 animate-pulse rounded-md bg-secondary-100" />
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
