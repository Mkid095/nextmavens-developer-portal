/**
 * ErrorAlert Component
 *
 * Displays error messages with a dismiss button.
 */

'use client'

import { X, AlertCircle } from 'lucide-react'

interface ErrorAlertProps {
  error: string | null
  onDismiss: () => void
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className="mb-6 rounded-lg border border-red-900/50 bg-red-900/20 p-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <p className="text-sm text-red-200">{error}</p>
        <button
          onClick={onDismiss}
          className="ml-auto text-red-400 hover:text-red-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
