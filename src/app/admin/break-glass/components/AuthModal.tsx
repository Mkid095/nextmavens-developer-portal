/**
 * Authentication Modal Component
 * Modal for break glass authentication
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Loader2, Shield } from 'lucide-react'
import type { AccessMethod } from '../types'

interface AuthModalProps {
  isOpen: boolean
  totpCode: string
  reason: string
  accessMethod: AccessMethod
  authenticating: boolean
  authError: string
  onTotpCodeChange: (code: string) => void
  onReasonChange: (reason: string) => void
  onAccessMethodChange: (method: AccessMethod) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function AuthModal({
  isOpen,
  totpCode,
  reason,
  accessMethod,
  authenticating,
  authError,
  onTotpCodeChange,
  onReasonChange,
  onAccessMethodChange,
  onSubmit,
  onClose,
}: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Break Glass Authentication</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>Warning:</strong> Initiating break glass creates a time-limited admin session
                  (1 hour). All actions performed during this session are logged with full audit trail.
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Access Method
                </label>
                <select
                  value={accessMethod}
                  onChange={(e) => onAccessMethodChange(e.target.value as AccessMethod)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
                >
                  <option value="otp">TOTP Code (Authenticator App)</option>
                  <option value="hardware_key">Hardware Key (YubiKey)</option>
                  <option value="emergency_code">Emergency Code</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => onTotpCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono text-center text-lg tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Emergency Access
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  placeholder="Explain why you need break glass access (min 10 characters)"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent resize-none"
                  rows={3}
                  minLength={10}
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">{reason.length}/500 characters</p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{authError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={authenticating}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authenticating || totpCode.length !== 6 || reason.length < 10}
                  className="flex-1 px-4 py-3 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Activate Session
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
