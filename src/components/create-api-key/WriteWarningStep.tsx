/**
 * Write Access Warning Step Component
 *
 * Step 3: Confirmation for MCP write/admin tokens.
 */

'use client'

import { Cpu, AlertTriangle, Key } from 'lucide-react'

interface WriteWarningStepProps {
  mcpAccessLevel: 'ro' | 'rw' | 'admin'
  writeWarningConfirmed: boolean
  submitting: boolean
  onConfirmChange: (confirmed: boolean) => void
  onBack: () => void
  onSubmit: () => void
  onClose: () => void
}

export function WriteWarningStep({
  mcpAccessLevel,
  writeWarningConfirmed,
  submitting,
  onConfirmChange,
  onBack,
  onSubmit,
  onClose,
}: WriteWarningStepProps) {
  return (
    <div className="space-y-6">
      {/* Warning Icon */}
      <div className="text-center py-6">
        <Cpu className="w-16 h-16 text-amber-600 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">Confirm Write Access</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          You are about to create an MCP token with {mcpAccessLevel === 'rw' ? 'read/write' : 'admin'} access.
        </p>
      </div>

      {/* Warning Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-2">This AI Can Modify Your Data</h4>
            <p className="text-sm text-red-800 mb-3">
              This token will allow AI assistants to make changes to your data. Only grant write access to trusted AI systems that you control.
            </p>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Read/write tokens can insert, update, and delete data</li>
              <li>Admin tokens have full access including destructive operations</li>
              <li>These permissions should only be granted to trusted systems</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Checkbox Confirmation */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={writeWarningConfirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 mt-0.5"
          />
          <p className="text-sm text-amber-900">
            <span className="font-semibold">I understand</span> that this token can modify my data and I am granting this access only to a trusted AI system.
          </p>
        </label>
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
          disabled={!writeWarningConfirmed || submitting}
          className="px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              Confirm & Create Key
            </>
          )}
        </button>
      </div>
    </div>
  )
}
