'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useAuthStore } from '@/store/auth-store'
import { useInitializeAuth } from '@/hooks/use-initialize-auth'

type AppLayoutProps = {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  useInitializeAuth()
  const router = useRouter()
  const { user, isInitializing } = useAuthStore()

  useEffect(() => {
    if (!isInitializing && !user) {
      router.replace('/login')
    }
  }, [isInitializing, user, router])

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Inicializando sessão...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <AppShell>{children}</AppShell>
}
