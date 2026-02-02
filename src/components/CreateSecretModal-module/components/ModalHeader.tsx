/**
 * Create Secret Modal - Header Component
 */

import { X, Key } from 'lucide-react'

interface ModalHeaderProps {
  createdSecret: { name: string; value: string } | null
  onClose: () => void
  submitting: boolean
}

export function ModalHeader({ createdSecret, onClose, submitting }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {createdSecret ? 'Secret Created' : 'Create Secret'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {createdSecret
              ? 'Copy your secret value now - you won\'t be able to see it again'
              : 'Add a new secret to your project'}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        disabled={submitting}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="w-5 h-5 text-slate-500" />
      </button>
    </div>
  )
}
