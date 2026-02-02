/**
 * Organizations Page - Module - Empty State Component
 */

import { Building2, Plus } from 'lucide-react'

interface EmptyStateProps {
  onCreateClick: () => void
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
      <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No organizations yet</h3>
      <p className="text-slate-600 mb-6">Create your first organization to collaborate with your team</p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
      >
        <Plus className="w-5 h-5" />
        Create Organization
      </button>
    </div>
  )
}
