import { X, AlertCircle, RefreshCw } from 'lucide-react'

interface RotateKeyModalProps {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RotateKeyModal({ isOpen, isSubmitting, onClose, onConfirm }: RotateKeyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Rotate API Key</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Important Information</h3>
              <p className="text-sm text-amber-800 mb-2">
                Rotating this key will create a new key version. The old key will remain active for a{' '}
                <strong>24-hour grace period</strong> to give you time to update your applications.
              </p>
              <p className="text-sm text-amber-800">
                After 24 hours, the old key will be automatically expired and will no longer work.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">What happens next:</h4>
            <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
              <li>A new API key will be generated</li>
              <li>You&apos;ll see the new key (shown once - copy it!)</li>
              <li>The old key will expire in 24 hours</li>
              <li>Update your applications to use the new key</li>
            </ol>
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
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Rotating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Rotate Key
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
