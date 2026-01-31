'use client'

/**
 * Create Secret Modal
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Modal for creating new secrets with validation
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from 'lucide-react'
import type { CreateSecretRequest } from '@/lib/types/secrets.types'

interface CreateSecretModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateSecretRequest) => Promise<void>
  projectId: string
}

export default function CreateSecretModal({
  isOpen,
  onClose,
  onCreate,
  projectId,
}: CreateSecretModalProps) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdSecret, setCreatedSecret] = useState<{ name: string; value: string } | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setValue('')
      setShowValue(false)
      setError('')
      setCreatedSecret(null)
      setSubmitting(false)
    }
  }, [isOpen])

  const validateName = (name: string): string | null => {
    if (!name) return 'Secret name is required'
    if (name.length > 255) return 'Secret name must be less than 255 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return 'Secret name can only contain letters, numbers, hyphens, and underscores'
    }
    return null
  }

  const validateValue = (value: string): string | null => {
    if (!value) return 'Secret value is required'
    if (value.length > 10000) return 'Secret value must be less than 10,000 characters'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    const valueError = validateValue(value)
    if (valueError) {
      setError(valueError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onCreate({
        project_id: projectId,
        name,
        value,
      })

      // Show success state with the value (one-time display)
      setCreatedSecret({ name, value })
      setName('')
      setValue('')
    } catch (err: any) {
      setError(err.message || 'Failed to create secret')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyValue = () => {
    if (createdSecret?.value) {
      navigator.clipboard.writeText(createdSecret.value)
      // Could add toast notification here
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {createdSecret ? 'Secret Created' : 'Create Secret'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {createdSecret
                        ? 'Copy your secret value now - you won\'t be able to see it again'
                        : 'Add a new secret to your project'}
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
                {createdSecret ? (
                  // Success view - show secret value one time
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Secret created successfully</span>
                      </div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500">
                        Secret name: <strong>{createdSecret.name}</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Secret Value
                      </label>
                      <div className="relative">
                        <input
                          type={showValue ? 'text' : 'password'}
                          value={createdSecret.value}
                          readOnly
                          className="w-full pr-24 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm text-slate-900 dark:text-white"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => setShowValue(!showValue)}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title={showValue ? 'Hide value' : 'Show value'}
                          >
                            {showValue ? (
                              <EyeOff className="w-4 h-4 text-slate-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyValue}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Copy value"
                          >
                            <Check className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Copy this value now. You won't be able to see it again.
                      </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  // Form view
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error message */}
                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                      </div>
                    )}

                    {/* Secret name */}
                    <div>
                      <label htmlFor="secret-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Secret Name
                      </label>
                      <input
                        id="secret-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., DATABASE_URL, API_KEY"
                        disabled={submitting}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        autoFocus
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Letters, numbers, hyphens, and underscores only
                      </p>
                    </div>

                    {/* Secret value */}
                    <div>
                      <label htmlFor="secret-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Secret Value
                      </label>
                      <div className="relative">
                        <input
                          id="secret-value"
                          type={showValue ? 'text' : 'password'}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder="Enter your secret value"
                          disabled={submitting}
                          className="w-full pr-12 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
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
                        disabled={submitting || !name || !value}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Secret'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
