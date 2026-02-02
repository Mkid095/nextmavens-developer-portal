/**
 * Create API Key Modal Component
 *
 * Modal for creating new API keys.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Loader2 } from 'lucide-react'
import type { KeyEnvironment } from '../types'

interface CreateApiKeyModalProps {
  show: boolean
  apiKeyName: string
  keyEnvironment: KeyEnvironment
  error: string
  submitting: boolean
  onClose: () => void
  onApiKeyNameChange: (name: string) => void
  onKeyEnvironmentChange: (env: KeyEnvironment) => void
  onSubmit: () => void
}

export function CreateApiKeyModal({
  show,
  apiKeyName,
  keyEnvironment,
  error,
  submitting,
  onClose,
  onApiKeyNameChange,
  onKeyEnvironmentChange,
  onSubmit,
}: CreateApiKeyModalProps) {
  if (!show) return null

  return (
    <AnimatePresence>
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
            <h2 className="text-xl font-semibold text-slate-900">Create API Key</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Key Name
              </label>
              <input
                type="text"
                value={apiKeyName}
                onChange={(e) => onApiKeyNameChange(e.target.value)}
                placeholder="e.g., Production App"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Environment
              </label>
              <select
                value={keyEnvironment}
                onChange={(e) => onKeyEnvironmentChange(e.target.value as KeyEnvironment)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
              >
                <option value="live">Production (Live)</option>
                <option value="test">Staging (Test)</option>
                <option value="dev">Development (Dev)</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                The key prefix will include this environment (e.g., pk_live_, pk_test_, pk_dev_)
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> You will only see your secret key once. Make sure to copy it and store it securely.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Key'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
