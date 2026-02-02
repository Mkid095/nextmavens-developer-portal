/**
 * Break Glass Toasts Hook
 * Manages toast notifications for break glass console
 */

import { useState } from 'react'
import type { Toast } from '../types'
import { TOAST_DURATION } from '../constants'

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast,
  }
}
