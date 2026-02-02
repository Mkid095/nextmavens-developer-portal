/**
 * Create Secret Modal - Form View Component
 */

import { AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react'
import type { FormState } from '../types'

interface FormViewProps {
  formState: FormState
  onNameChange: (name: string) => void
  onValueChange: (value: string) => void
  onToggleShowValue: () => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function FormView({
  formState,
  onNameChange,
  onValueChange,
  onToggleShowValue,
  onSubmit,
  onClose,
}: FormViewProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Error message */}
      {formState.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{formState.error}</p>
        </div>
      )}

      {/* Secret name */}
      <div>
        <label htmlFor="secret-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Secret Name
        </label>
        <input
          id="secret-name"
          type="text"
          value={formState.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., DATABASE_URL, API_KEY"
          disabled={formState.submitting}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Letters, numbers, hyphens, and underscores only
        </p>
      </div>

      {/* Secret value */}
      <div>
        <label htmlFor="secret-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Secret Value
        </label>
        <div className="relative">
          <input
            id="secret-value"
            type={formState.showValue ? 'text' : 'password'}
            value={formState.value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Enter your secret value"
            disabled={formState.submitting}
            className="w-full pr-12 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
          <button
            type="button"
            onClick={onToggleShowValue}
            disabled={formState.submitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={formState.showValue ? 'Hide value' : 'Show value'}
          >
            {formState.showValue ? (
              <EyeOff className="w-4 h-4 text-slate-500" />
            ) : (
              <Eye className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={formState.submitting}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formState.submitting || !formState.name || !formState.value}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {formState.submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Secret'
          )}
        </button>
      </div>
    </form>
  )
}
