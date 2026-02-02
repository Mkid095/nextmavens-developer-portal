/**
 * Support Request Modal - Success State Component
 */

import { Check, FileText } from 'lucide-react'

interface SuccessStateProps {
  requestId: string | null
  onClose: () => void
}

export function SuccessState({ requestId, onClose }: SuccessStateProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">Support Request Created!</h3>
        <p className="text-slate-600">
          Your support request has been submitted successfully.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Request ID</span>
          <span className="text-sm font-mono text-emerald-700">{requestId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <span className="text-sm px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">Open</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Our support team will review your request</li>
              <li>• You'll receive an email notification when status changes</li>
              <li>• Context from your project has been automatically attached</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full px-6 py-3 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
      >
        Done
      </button>
    </div>
  )
}
