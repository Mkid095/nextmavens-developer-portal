/**
 * Admin Token Warning Step Component
 *
 * Step 4: Extra confirmation for MCP admin tokens.
 */

'use client'

import { AlertTriangle, Shield } from 'lucide-react'

interface AdminWarningStepProps {
  adminWarningConfirmed: boolean
  submitting: boolean
  onConfirmChange: (confirmed: boolean) => void
  onBack: () => void
  onSubmit: () => void
  onClose: () => void
}

export function AdminWarningStep({
  adminWarningConfirmed,
  submitting,
  onConfirmChange,
  onBack,
  onSubmit,
  onClose,
}: AdminWarningStepProps) {
  return (
    <div className="space-y-6">
      {/* Critical Warning Icon */}
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">Critical: Admin Access</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          You are about to create an MCP admin token with <span className="font-bold text-red-600">FULL DESTRUCTIVE ACCESS</span>.
        </p>
      </div>

      {/* Critical Warning Alert */}
      <div className="bg-red-100 border-2 border-red-300 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-7 h-7 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-900 mb-3 text-lg">⚠️ CRITICAL SECURITY WARNING</h4>
            <p className="text-sm text-red-900 mb-4 font-medium">
              Admin tokens have FULL ACCESS including data deletion and user management.
            </p>
            <ul className="text-sm text-red-900 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-700 font-bold">•</span>
                <span><strong>Can DELETE all data</strong> - Destructive operations cannot be undone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-700 font-bold">•</span>
                <span><strong>Can MANAGE users</strong> - Create, disable, and delete user accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-700 font-bold">•</span>
                <span><strong>Can PUBLISH to realtime</strong> - Send data to all WebSocket connections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-700 font-bold">•</span>
                <span><strong>NO scope limitations</strong> - Full access to all services</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-red-200 rounded-lg">
              <p className="text-xs text-red-900 font-medium">
                <strong>Best Practice:</strong> Only use admin tokens for trusted AI operations tools in controlled environments. Never expose admin tokens in client-side code or untrusted environments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Double Checkbox Confirmation */}
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={adminWarningConfirmed}
              onChange={(e) => onConfirmChange(e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500 mt-0.5"
            />
            <p className="text-sm text-red-900">
              <span className="font-semibold">I understand</span> that this admin token has full destructive access and I am accepting full responsibility for any data loss or security issues.
            </p>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          Back
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!adminWarningConfirmed || submitting}
          className="px-6 py-3 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Create Admin Token
            </>
          )}
        </button>
      </div>
    </div>
  )
}
