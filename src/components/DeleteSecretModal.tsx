'use client'

/**
 * Delete Secret Modal
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Confirmation modal for deleting secrets
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { Secret } from '@/lib/types/secrets.types'

interface DeleteSecretModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  secret: Secret | null
}

export default function DeleteSecretModal({
  isOpen,
  onClose,
  onConfirm,
  secret,
}: DeleteSecretModalProps) {
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (!submitting) {
      setConfirmed(false)
      setConfirming(false)
      setError('')
      onClose()
    }
  }

  const handleConfirm = async () => {
    if (!confirmed) {
      setConfirming(true)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onConfirm()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete secret')
      setSubmitting(false)
      setConfirmed(false)
      setConfirming(false)
    }
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
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Delete Secret
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      This action cannot be undone
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

                {/* Warning */}
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-400">
                        Warning: You are about to delete a secret
                      </p>
                      <p className="mt-1 text-amber-700 dark:text-amber-500">
                        All versions of <strong>{secret.name}</strong> will be marked for deletion.
                        The data will be permanently deleted after 30 days.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secret details */}
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Secret Name</span>
                    <span className="font-medium text-slate-900 dark:text-white">{secret.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Version</span>
                    <span className="font-medium text-slate-900 dark:text-white">v{secret.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                    <span className={`font-medium ${secret.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
                      {secret.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Confirmation checkbox */}
                {confirming && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        disabled={submitting}
                        className="mt-1 w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        I understand that this action cannot be undone and all versions of this secret will be permanently deleted after 30 days.
                      </span>
                    </label>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting || (confirming && !confirmed)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : confirming ? (
                      'Confirm Delete'
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
