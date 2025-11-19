'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { acceptInvite, validateInvite } from '@/lib/auth-api'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const registrationSchema = z
  .object({
    nome: z
      .string()
      .min(3, 'Informe seu nome completo.')
      .max(80, 'Nome muito longo. Utilize abreviações se necessário.'),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula.')
      .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula.')
      .regex(/\d/, 'Inclua ao menos um número.')
      .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um caractere especial.'),
    confirmPassword: z.string(),
    aceitarTermos: z.boolean().refine((value) => value === true, {
      message: 'É necessário aceitar os termos de uso.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type RegistrationForm = z.infer<typeof registrationSchema>

interface RegisterInvitePageProps {
  params: { token: string }
}

export default function RegisterInvitePage({ params }: RegisterInvitePageProps) {
  const token = decodeURIComponent(params.token)
  const router = useRouter()
  const { setSession } = useAuthStore()
  const [isLoading, setLoading] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [invite, setInvite] = useState<Awaited<ReturnType<typeof validateInvite>> | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      aceitarTermos: false,
    },
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    validateInvite(token)
      .then((data) => {
        if (!cancelled) {
          setInvite(data)
          setInviteError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvite(null)
          setInviteError(
            'Não foi possível validar o convite. Verifique se o token está correto ou solicite um novo convite.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const passwordValue = watch('password')

  const passwordStrengthHints = useMemo(() => {
    if (!passwordValue) {
      return []
    }
    const hints: string[] = []
    if (!/[A-Z]/.test(passwordValue)) hints.push('Adicione uma letra maiúscula.')
    if (!/[a-z]/.test(passwordValue)) hints.push('Adicione uma letra minúscula.')
    if (!/\d/.test(passwordValue)) hints.push('Inclua ao menos um número.')
    if (!/[^A-Za-z0-9]/.test(passwordValue)) hints.push('Inclua um símbolo ou caractere especial.')
    if (passwordValue.length < 12)
      hints.push('Utilize ao menos 12 caracteres para maior segurança.')
    return hints
  }, [passwordValue])

  const onSubmit = async (data: RegistrationForm) => {
    try {
      setSubmitError(null)
      const session = await acceptInvite({
        token,
        nome: data.nome,
        password: data.password,
      })
      setSession(session)
      router.replace('/dashboard')
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir o cadastro. Tente novamente ou solicite um novo convite.',
      )
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-10">
      <Card className="w-full max-w-3xl border-0 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Concluir cadastro</CardTitle>
          <CardDescription>
            Defina a sua senha pessoal e confirme as informações do convite para acessar o PM Hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {inviteError && (
              <div className="rounded-lg border border-error-light bg-error-light/20 p-4 text-sm text-error-dark">
                {inviteError}
                <div className="mt-3 text-xs text-error-dark/90">
                  <span className="font-medium">Dica:</span> copie o token diretamente do e-mail e
                  certifique-se de que ele não expirou.
                </div>
              </div>
            )}

            {invite && !inviteError && (
              <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-4 text-sm text-primary-900 shadow-sm">
                <p>
                  Convite para <span className="font-semibold">{invite.email}</span> participar do
                  tenant{' '}
                  <span className="font-semibold">{invite.tenantNome ?? invite.tenantId}</span> como{' '}
                  <span className="font-semibold">{invite.role}</span>.
                </p>
                <p className="mt-2 text-xs">
                  Expira em {new Date(invite.expiresAt).toLocaleString('pt-BR')}. Caso o convite
                  expire, solicite um novo à equipe de ProductOps.
                </p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Como deseja ser identificado internamente"
                  {...register('nome')}
                  disabled={isLoading || Boolean(inviteError)}
                  error={Boolean(errors.nome)}
                />
                {errors.nome && (
                  <p className="text-xs font-medium text-error-dark">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Crie uma senha forte"
                  {...register('password')}
                  disabled={isLoading || Boolean(inviteError)}
                  error={Boolean(errors.password)}
                />
                <p className="text-xs text-text-muted">
                  Use letras maiúsculas e minúsculas, números e caracteres especiais.
                </p>
                {passwordStrengthHints.length > 0 && (
                  <ul className="text-warning-700 space-y-1 text-xs">
                    {passwordStrengthHints.map((hint) => (
                      <li key={hint}>• {hint}</li>
                    ))}
                  </ul>
                )}
                {errors.password && (
                  <p className="text-xs font-medium text-error-dark">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  {...register('confirmPassword')}
                  disabled={isLoading || Boolean(inviteError)}
                  error={Boolean(errors.confirmPassword)}
                />
                {errors.confirmPassword && (
                  <p className="text-xs font-medium text-error-dark">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary-600"
                  {...register('aceitarTermos')}
                  disabled={isLoading || Boolean(inviteError)}
                />
                <span>
                  Li e concordo com os{' '}
                  <Link
                    href="https://www.productops.com.br/politica-de-uso"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-600 underline-offset-4 hover:underline"
                  >
                    termos de uso e política de privacidade
                  </Link>
                  .
                </span>
              </label>
              {errors.aceitarTermos && (
                <p className="text-xs font-medium text-error-dark">
                  {errors.aceitarTermos.message}
                </p>
              )}

              {submitError && (
                <div className="rounded-lg border border-error-light bg-error-light/20 p-3 text-sm text-error-dark">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={isSubmitting}
                disabled={isSubmitting || isLoading || Boolean(inviteError)}
              >
                Ativar minha conta
              </Button>
            </form>
          </div>

          <aside className="space-y-4 rounded-xl border border-slate-200 bg-white/80 p-5 shadow-inner">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Como funciona?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Completando este formulário você criará uma credencial própria para acessar o PM
                Hub. Sua participação ficará registrada com base no tenant e papel definidos no
                convite.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Boas práticas de senha</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                <li>Nunca reutilize senhas corporativas em outros sistemas.</li>
                <li>Evite usar informações pessoais fáceis de adivinhar.</li>
                <li>Mantenha sua senha em sigilo e não compartilhe com terceiros.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-accent-200 bg-accent-50/60 p-4 text-xs text-accent-900">
              <p className="font-medium">Convite expirado?</p>
              <p className="mt-1">
                Solicite um novo convite ao administrador ProductOps ou envie um e-mail para{' '}
                <a
                  href="mailto:suporte@cpopm.com.br"
                  className="font-semibold text-accent-700 underline-offset-4 hover:underline"
                >
                  suporte@cpopm.com.br
                </a>
                .
              </p>
            </div>

            <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
              Já tem senha configurada?{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Fazer login
              </Link>
            </div>
          </aside>
        </CardContent>
      </Card>
    </main>
  )
}
