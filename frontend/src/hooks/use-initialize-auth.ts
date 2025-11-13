'use client'

import { useEffect } from 'react'
import { bootstrapSession } from '@/lib/auth-api'
import { useAuthStore } from '@/store/auth-store'

export function useInitializeAuth() {
  const { user, setSession, setInitializing, isInitializing } = useAuthStore()

  useEffect(() => {
    if (!isInitializing || user) {
      return
    }

    bootstrapSession()
      .then((session) => {
        if (session) {
          setSession(session)
        }
      })
      .finally(() => {
        setInitializing(false)
      })
  }, [isInitializing, setSession, setInitializing, user])
}
