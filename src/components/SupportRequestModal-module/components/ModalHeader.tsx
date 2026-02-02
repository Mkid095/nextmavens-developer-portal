/**
 * Support Request Modal - Header Component
 */

import { X, LifeBuoy } from 'lucide-react'

interface ModalHeaderProps {
  success: boolean
  onClose: () => void
}

export function ModalHeader({ success, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <LifeBuoy className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Request Support</h2>
          <p className="text-sm text-slate-500">
            {success ? 'Request submitted' : 'Get help from our support team'}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-slate-100 rounded-lg transition"
      >
        <X className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  )
}
