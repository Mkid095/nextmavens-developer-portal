'use client'

import { useState, useCallback } from 'react'
import { Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type {
  ResetPasswordButtonProps,
  ResetPasswordState,
  ResetPasswordResponse,
  ResetPasswordErrorResponse,
} from '@/features/users/types'

export function ResetPasswordButton({
  userId,
  userEmail,
  onSuccess,
}: ResetPasswordButtonProps) {
  const [state, setState] = useState<ResetPasswordState>({
    isResetting: false,
    showSuccess: false,
    error: null,
  })

  const handleResetPassword = useCallback(async () => {
    setState((prev) => ({ ...prev, isResetting: true, error: null, showSuccess: false }))

    try {
      // SECURITY WARNING: localStorage is vulnerable to XSS attacks.
      // In production, tokens should be stored in httpOnly cookies.
      // TODO: Refactor to use secure cookie-based authentication.
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const res = await fetch(`/api/auth/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })

      if (!res.ok) {
        const data = (await res.json()) as ResetPasswordErrorResponse
        throw new Error(data.error || 'Failed to send password reset email')
      }

      const data = (await res.json()) as ResetPasswordResponse

      if (data.email_sent) {
        setState({
          isResetting: false,
          showSuccess: true,
          error: null,
        })

        // Call the callback if provided
        if (onSuccess) {
          onSuccess()
        }

        // Hide success message after 5 seconds
        setTimeout(() => {
          setState((prev) => ({ ...prev, showSuccess: false }))
        }, 5000)
      } else {
        throw new Error('Failed to send password reset email')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email'
      setState({
        isResetting: false,
        showSuccess: false,
        error: message,
      })

      // Hide error message after 5 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, error: null }))
      }, 5000)
    }
  }, [userId, userEmail, onSuccess])

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleResetPassword}
        disabled={state.isResetting || state.showSuccess}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state.isResetting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Key className="w-4 h-4" />
            <span>Reset Password</span>
          </>
        )}
      </button>

      {state.showSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Password reset email sent to {userEmail}</span>
        </div>
      )}

      {state.error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{state.error}</span>
        </div>
      )}
    </div>
  )
}
