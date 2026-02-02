/**
 * Dashboard Hooks - Module - Toast Hook
 */

import { useState, useCallback } from 'react'
import type { Toast } from '../../utils'
import { TOAST_DURATION } from '../constants'

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  return { toasts, addToast }
}
