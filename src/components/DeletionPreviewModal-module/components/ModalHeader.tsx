/**
 * Deletion Preview Modal - Header Component
 */

import { X, Trash2 } from 'lucide-react'

interface ModalHeaderProps {
  onClose: () => void
  disabled: boolean
}

export function ModalHeader({ onClose, disabled }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-red-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <Trash2 className="w-5 h-5 text-red-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Delete Project</h2>
          <p className="text-sm text-slate-600">This action cannot be undone</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-red-100 rounded-lg transition"
        disabled={disabled}
      >
        <X className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  )
}
