'use client'

/**
 * Secret Rotate Modal
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Modal for rotating secrets to new versions
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Clock,
  Info,
} from 'lucide-react'
import type { Secret, RotateSecretRequest } from '@/lib/types/secrets.types'

interface SecretRotateModalProps {
  isOpen: boolean
  onClose: () => void
  onRotate: (data: RotateSecretRequest) => Promise<void>
  secret: Secret | null
}

export default function SecretRotateModal({
  isOpen,
  onClose,
  onRotate,
  secret,
}: SecretRotateModalProps) {
  const [newValue, setNewValue] = useState('')
  const [reason, setReason] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setNewValue('')
      setReason('')
      setShowValue(false)
      setError('')
      setSubmitting(false)
    }
  }, [isOpen])

  const validateValue = (value: string): string | null => {
    if (!value) return 'New secret value is required'
    if (value.length > 10000) return 'Secret value must be less than 10,000 characters'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const valueError = validateValue(newValue)
    if (valueError) {
      setError(valueError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onRotate({
        value: newValue,
        rotation_reason: reason || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to rotate secret')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onClose()
    }
  }

  const formatGracePeriodEnd = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <AnimatePresence>
      {isOpen && secret && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Rotate Secret
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {secret.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Grace period info */}
                {secret.grace_period_ends_at && (
                  <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-400">
                          Previous version grace period
                        </p>
                        <p className="mt-1 text-amber-700 dark:text-amber-500">
                          The old version (v{secret.version}) will remain accessible until{' '}
                          <strong>{formatGracePeriodEnd(secret.grace_period_ends_at)}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info about rotation */}
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-400">
                        What happens during rotation?
                      </p>
                      <ul className="mt-1 text-blue-700 dark:text-blue-500 space-y-1">
                        <li>• A new version (v{secret.version + 1}) will be created</li>
                        <li>• The old version will be marked as inactive</li>
                        <li>• The old version will be deleted after 24 hours</li>
                        <li>• Consumers using the old value have time to update</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New secret value */}
                  <div>
                    <label htmlFor="new-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Secret Value
                    </label>
                    <div className="relative">
                      <input
                        id="new-value"
                        type={showValue ? 'text' : 'password'}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Enter new secret value"
                        disabled={submitting}
                        className="w-full pr-12 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowValue(!showValue)}
                        disabled={submitting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={showValue ? 'Hide value' : 'Show value'}
                      >
                        {showValue ? (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Rotation reason (optional) */}
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rotation Reason <span className="text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Regular security rotation, key compromised, etc."
                      disabled={submitting}
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {reason.length}/500 characters
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !newValue}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Rotating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Rotate Secret
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
