'use client'

import { useState, useEffect } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DeleteUserConfirmationModalProps } from '../types'

export function DeleteUserConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  userName,
  isLoading,
}: DeleteUserConfirmationModalProps) {
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationEmail('')
      setError(null)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    setError(null)

    try {
      await onConfirm()
      // Modal will be closed by parent component on success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      setError(message)
    }
  }

  const isConfirmed = confirmationEmail.toLowerCase() === userEmail.toLowerCase()

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Delete User
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Warning message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 mb-1">
                  Warning: This action cannot be undone
                </p>
                <p className="text-xs text-red-700">
                  Permanently removing this user will delete all their data and access to the platform.
                </p>
              </div>

              {/* User details */}
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  You are about to delete the following user:
                </p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    {userName || 'No name provided'}
                  </p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                </div>
              </div>

              {/* Confirmation input */}
              <div className="space-y-2">
                <label htmlFor="confirm-email" className="block text-sm font-medium text-slate-700">
                  Type the user email to confirm
                </label>
                <input
                  id="confirm-email"
                  type="text"
                  value={confirmationEmail}
                  onChange={(e) => setConfirmationEmail(e.target.value)}
                  placeholder={userEmail}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="off"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Confirm Delete
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
