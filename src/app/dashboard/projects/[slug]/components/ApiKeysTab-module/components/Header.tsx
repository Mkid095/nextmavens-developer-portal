/**
 * API Keys Tab - Header Component
 */

import { Plus } from 'lucide-react'

interface HeaderProps {
  canManageKeys: boolean
  onCreateKey: () => void
}

export function Header({ canManageKeys, onCreateKey }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-slate-900">API Keys</h2>
      {canManageKeys && (
        <button
          onClick={onCreateKey}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Create Key</span>
        </button>
      )}
    </div>
  )
}
