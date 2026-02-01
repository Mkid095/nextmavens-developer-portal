import { X, ShieldAlert } from 'lucide-react'

interface RevokeKeyModalProps {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RevokeKeyModal({ isOpen, isSubmitting, onClose, onConfirm }: RevokeKeyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Revoke API Key</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Warning: Immediate Action</h3>
              <p className="text-sm text-red-800">
                Revoking this API key will <strong>immediately invalidate it</strong>. Any applications or
                services using this key will stop working right away.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Before revoking:</h4>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>Ensure no active applications are using this key</li>
              <li>Consider rotating instead to maintain uptime</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                Revoke Key
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
