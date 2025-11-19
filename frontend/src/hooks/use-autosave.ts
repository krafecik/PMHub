import { useEffect, useRef, useState } from 'react'
type AutosaveStatus = 'idle' | 'saving' | 'saved'

type AutosaveOptions<T> = {
  delay?: number
  enabled?: boolean
  serialize?: (value: T) => unknown
}

export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<void> | void,
  options?: AutosaveOptions<T>,
): AutosaveStatus {
  const {
    delay = 1200,
    enabled = true,
    serialize = (val: T) => JSON.stringify(val),
  } = options ?? {}
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const lastSavedRef = useRef<unknown>(serialize(value))
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const nextValue = serialize(value)

    if (nextValue === lastSavedRef.current) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      setStatus('saving')
      await onSave(value)
      lastSavedRef.current = serialize(value)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onSave, delay, enabled, serialize])

  return status
}
