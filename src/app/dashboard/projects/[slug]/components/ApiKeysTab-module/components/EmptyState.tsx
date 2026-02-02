/**
 * API Keys Tab - Empty State Component
 */

import { Key } from 'lucide-react'

interface EmptyStateProps {
  canManageKeys: boolean
  onCreateKey: () => void
}

export function EmptyState({ canManageKeys, onCreateKey }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-600">No API keys yet</p>
      {canManageKeys && (
        <button
          onClick={onCreateKey}
          className="mt-4 text-emerald-700 hover:text-emerald-800 font-medium"
        >
          Create your first API key
        </button>
      )}
    </div>
  )
}
