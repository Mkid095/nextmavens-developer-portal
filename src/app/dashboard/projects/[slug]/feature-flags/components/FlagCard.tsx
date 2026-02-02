/**
 * Flag Card Component
 * Individual feature flag card
 */

import { motion } from 'framer-motion'
import { ToggleLeft, ToggleRight, Trash2, Loader2 } from 'lucide-react'
import type { FeatureFlag } from '../types'

interface FlagCardProps {
  flag: FeatureFlag
  isUpdating: boolean
  isDeleting: boolean
  onToggle: () => void
  onDelete: () => void
  showDelete?: boolean
}

export function FlagCard({
  flag,
  isUpdating,
  isDeleting,
  onToggle,
  onDelete,
  showDelete = true,
}: FlagCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900">{flag.name}</h3>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-purple-100 text-purple-800 border-purple-200">
              {flag.scope}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                flag.enabled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {flag.enabled
              ? `This feature is enabled for this ${flag.scope} (overrides global setting)`
              : `This feature is disabled for this ${flag.scope} (overrides global setting)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            disabled={isUpdating || isDeleting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              flag.enabled
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : flag.enabled ? (
              <>
                <ToggleRight className="w-5 h-5" />
                Enabled
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                Disabled
              </>
            )}
          </button>
          {showDelete && (
            <button
              onClick={onDelete}
              disabled={isDeleting || isUpdating}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove project-specific override"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
