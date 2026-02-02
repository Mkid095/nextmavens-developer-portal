/**
 * Abuse Dashboard - Error Message Component
 */

import { AlertTriangle } from 'lucide-react'

interface ErrorMessageProps {
  error: string
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-medium text-red-900">Error loading dashboard</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    </div>
  )
}
