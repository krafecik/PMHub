'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const tokenSchema = z.object({
  token: z
    .string()
    .min(10, 'Informe o token recebido por e-mail.')
    .regex(/^[A-Za-z0-9\-_\.]+$/, 'Token inválido. Copie e cole exatamente como recebido.'),
})

type TokenForm = z.infer<typeof tokenSchema>

export default function RegisterIndexPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TokenForm>({
    resolver: zodResolver(tokenSchema),
  })

  const onSubmit = (data: TokenForm) => {
    router.push(`/register/${encodeURIComponent(data.token)}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Ativar conta com convite</CardTitle>
          <CardDescription>
            Cole abaixo o token enviado por e-mail para configurar sua senha e acessar o PM Hub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="token">Token de convite</Label>
              <Input
                id="token"
                placeholder="ex: INVITE-XYZ-123"
                autoComplete="off"
                {...register('token')}
                error={Boolean(errors.token)}
              />
              {errors.token && (
                <p className="text-xs font-medium text-error-dark">{errors.token.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
              Continuar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Já possui senha?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 transition hover:text-primary-700"
            >
              Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
