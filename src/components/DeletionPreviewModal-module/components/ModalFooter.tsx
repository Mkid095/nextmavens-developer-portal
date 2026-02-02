/**
 * Deletion Preview Modal - Footer Component
 */

import { Trash2 } from 'lucide-react'

interface ModalFooterProps {
  confirmed: boolean
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
  onConfirmedChange: (confirmed: boolean) => void
}

export function ModalFooter({
  confirmed,
  deleting,
  onClose,
  onConfirm,
  onConfirmedChange,
}: ModalFooterProps) {
  return (
    <div className="p-6 border-t border-slate-200 bg-slate-50">
      {/* Confirmation Checkbox */}
      <label className="flex items-start gap-3 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirmedChange(e.target.checked)}
          disabled={deleting}
          className="w-5 h-5 mt-0.5 text-red-600 rounded focus:ring-red-500 focus:ring-offset-0"
        />
        <span className="text-sm text-slate-700">
          I understand that this action cannot be undone and want to delete this project
        </span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={deleting}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-white transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting || !confirmed}
          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {deleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Confirm Delete
            </>
          )}
        </button>
      </div>
    </div>
  )
}
