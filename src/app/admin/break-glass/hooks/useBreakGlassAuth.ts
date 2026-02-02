/**
 * Break Glass Authentication Hook
 * Handles break glass authentication flow
 */

import { useState } from 'react'
import type { BreakGlassSession, BreakGlassError, AccessMethod } from '../types'

interface UseBreakGlassAuthOptions {
  onSuccess: (session: BreakGlassSession) => void
  onError: (message: string) => void
}

export function useBreakGlassAuth({ onSuccess, onError }: UseBreakGlassAuthOptions) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [reason, setReason] = useState('')
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('otp')
  const [authenticating, setAuthenticating] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthenticating(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/break-glass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: totpCode,
          reason: reason.trim(),
          access_method: accessMethod,
        }),
      })

      const data: BreakGlassSession | BreakGlassError = await res.json()

      if (!res.ok || !data.success) {
        const error = data as BreakGlassError
        throw new Error(error.details || error.error || 'Authentication failed')
      }

      const sessionData = data as BreakGlassSession
      onSuccess(sessionData)
      closeModal()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setAuthError(message)
      onError(message)
    } finally {
      setAuthenticating(false)
    }
  }

  const closeModal = () => {
    setShowAuthModal(false)
    setTotpCode('')
    setReason('')
    setAuthError('')
  }

  const openModal = () => {
    setShowAuthModal(true)
  }

  return {
    showAuthModal,
    totpCode,
    setTotpCode,
    reason,
    setReason,
    accessMethod,
    setAccessMethod,
    authenticating,
    authError,
    handleAuthenticate,
    openModal,
    closeModal,
  }
}
