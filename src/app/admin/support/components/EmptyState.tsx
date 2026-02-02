/**
 * Empty State Component
 * Displayed when no support requests are found
 */

import { MessageSquare, RefreshCw } from 'lucide-react'

interface EmptyStateProps {
  loading: boolean
  message?: string
}

export function EmptyState({ loading, message }: EmptyStateProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Loading support requests...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">{message || 'No support requests found'}</p>
    </div>
  )
}
