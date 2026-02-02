/**
 * Flag List Component
 * List of feature flags with empty state
 */

import { RefreshCw, Settings } from 'lucide-react'
import type { FeatureFlag } from '../types'
import { FlagCard } from './FlagCard'

interface FlagListProps {
  title: string
  flags: FeatureFlag[]
  updating: string | null
  deleting: string | null
  onToggle: (flag: FeatureFlag) => void
  onDelete: (flag: FeatureFlag) => void
  onRefresh?: () => void
  fetching?: boolean
  showDelete?: boolean
  emptyMessage?: string
  emptySubtext?: string
  isReference?: boolean
}

export function FlagList({
  title,
  flags,
  updating,
  deleting,
  onToggle,
  onDelete,
  onRefresh,
  fetching,
  showDelete = true,
  emptyMessage = 'No flags',
  emptySubtext,
  isReference = false,
}: FlagListProps) {
  return (
    <div>
      {onRefresh && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onRefresh}
            disabled={fetching}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}
      {!onRefresh && <h2 className="text-lg font-semibold text-slate-900 mb-3">{title}</h2>}

      <div
        className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${
          isReference ? 'opacity-75' : ''
        }`}
      >
        {flags.length === 0 ? (
          <div className="p-8 text-center">
            <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">{emptyMessage}</p>
            {emptySubtext && <p className="text-sm text-slate-500 mt-1">{emptySubtext}</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {flags.map((flag) => (
              <FlagCard
                key={flag.name}
                flag={flag}
                isUpdating={updating === flag.name}
                isDeleting={deleting === flag.name}
                onToggle={() => onToggle(flag)}
                onDelete={() => onDelete(flag)}
                showDelete={showDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
