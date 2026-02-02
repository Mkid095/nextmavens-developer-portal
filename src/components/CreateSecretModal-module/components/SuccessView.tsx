/**
 * Create Secret Modal - Success View Component
 */

import { Check, Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface SuccessViewProps {
  createdSecret: { name: string; value: string }
  showValue: boolean
  onToggleShowValue: () => void
  onCopyValue: () => void
  onClose: () => void
}

export function SuccessView({
  createdSecret,
  showValue,
  onToggleShowValue,
  onCopyValue,
  onClose,
}: SuccessViewProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">Secret created successfully</span>
        </div>
        <p className="text-sm text-emerald-600 dark:text-emerald-500">
          Secret name: <strong>{createdSecret.name}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Secret Value
        </label>
        <div className="relative">
          <input
            type={showValue ? 'text' : 'password'}
            value={createdSecret.value}
            readOnly
            className="w-full pr-24 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm text-slate-900 dark:text-white"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              type="button"
              onClick={onToggleShowValue}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title={showValue ? 'Hide value' : 'Show value'}
            >
              {showValue ? (
                <EyeOff className="w-4 h-4 text-slate-500" />
              ) : (
                <Eye className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <button
              type="button"
              onClick={onCopyValue}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Copy value"
            >
              <Check className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Copy this value now. You won't be able to see it again.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </div>
  )
}
