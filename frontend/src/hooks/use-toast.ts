import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface UseToastReturn {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (toastId: string) => void
}

let toastId = 0

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setToasts((prev) => {
        const now = Date.now()
        return prev.filter((toast) => {
          const toastTime = parseInt(toast.id.split('-')[1])
          return now - toastTime < 5000 // Remove toasts after 5 seconds
        })
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const toast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${toastId++}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const dismiss = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }

  return { toasts, toast, dismiss }
}
