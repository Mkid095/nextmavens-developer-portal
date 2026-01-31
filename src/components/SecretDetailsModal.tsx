'use client'

/**
 * Secret Details Modal
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Modal for viewing secret details with show/hide value toggle
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Calendar,
  Hash,
  RefreshCw,
} from 'lucide-react'
import type { Secret, SecretDetails } from '@/lib/types/secrets.types'

interface SecretDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  secret: Secret | null
  onFetchDetails: (id: string) => Promise<SecretDetails>
}

export default function SecretDetailsModal({
  isOpen,
  onClose,
  secret,
  onFetchDetails,
}: SecretDetailsModalProps) {
  const [details, setDetails] = useState<SecretDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch details when modal opens or secret changes
  useEffect(() => {
    if (isOpen && secret) {
      setLoading(true)
      setError('')
      setDetails(null)
      setShowValue(false)

      onFetchDetails(secret.id)
        .then((data) => {
          setDetails(data)
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to fetch secret details')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, secret, onFetchDetails])

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDetails(null)
      setError('')
      setShowValue(false)
      setCopied(false)
    }
  }, [isOpen])

  const handleCopy = async () => {
    if (details?.value) {
      await navigator.clipboard.writeText(details.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatGracePeriodEnd = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const isExpired = date < now

    return {
      date: date.toLocaleString(),
      isExpired,
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {secret.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Secret Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {details && !loading && (
                  <div className="space-y-4">
                    {/* Secret value */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Secret Value
                      </label>
                      <div className="relative">
                        <input
                          type={showValue ? 'text' : 'password'}
                          value={details.value}
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
                            onClick={handleCopy}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title={copied ? 'Copied!' : 'Copy value'}
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Secret info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <Hash className="w-3 h-3" />
                          Version
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          v{details.version}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {details.active ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <RefreshCw className="w-3 h-3 text-slate-400" />
                          )}
                          Status
                        </div>
                        <p className={`text-sm font-medium ${details.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
                          {details.active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400">Created</span>
                        <span className="text-slate-900 dark:text-white">
                          {formatDate(details.created_at)}
                        </span>
                      </div>

                      {details.rotation_reason && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                            Rotation Reason
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-500">
                            {details.rotation_reason}
                          </p>
                        </div>
                      )}

                      {details.grace_period_ends_at && (
                        <div className={`p-3 border rounded-lg ${
                          formatGracePeriodEnd(details.grace_period_ends_at)?.isExpired
                            ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        }`}>
                          <p className={`text-xs font-medium mb-1 ${
                            formatGracePeriodEnd(details.grace_period_ends_at)?.isExpired
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            Grace Period Ends
                          </p>
                          <p className={`text-sm ${
                            formatGracePeriodEnd(details.grace_period_ends_at)?.isExpired
                              ? 'text-slate-500 dark:text-slate-500'
                              : 'text-amber-700 dark:text-amber-500'
                          }`}>
                            {formatGracePeriodEnd(details.grace_period_ends_at)?.date}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
