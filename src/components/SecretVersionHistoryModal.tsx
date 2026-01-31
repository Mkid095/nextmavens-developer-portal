'use client'

/**
 * Secret Version History Modal
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Modal for viewing secret version history
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  History,
  Loader2,
  AlertTriangle,
  Hash,
  Calendar,
  Check,
  X as XIcon,
  Clock,
} from 'lucide-react'
import type { Secret, SecretVersion } from '@/lib/types/secrets.types'

interface SecretVersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  secret: Secret | null
  onFetchVersions: (id: string) => Promise<SecretVersion[]>
  onViewVersion: (versionId: string) => void
}

export default function SecretVersionHistoryModal({
  isOpen,
  onClose,
  secret,
  onFetchVersions,
  onViewVersion,
}: SecretVersionHistoryModalProps) {
  const [versions, setVersions] = useState<SecretVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch versions when modal opens
  useEffect(() => {
    if (isOpen && secret) {
      setLoading(true)
      setError('')
      setVersions([])

      onFetchVersions(secret.id)
        .then((data) => {
          setVersions(data)
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to fetch version history')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, secret, onFetchVersions])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setVersions([])
      setError('')
    }
  }, [isOpen])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString()
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
              className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg relative max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Version History
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {secret.name} ({versions.length} version{versions.length !== 1 ? 's' : ''})
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
              <div className="p-6 overflow-y-auto flex-1">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {!loading && !error && versions.length === 0 && (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No version history available</p>
                  </div>
                )}

                {!loading && !error && versions.length > 0 && (
                  <div className="space-y-3">
                    {versions.map((version, index) => (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                          version.active
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        }`}
                        onClick={() => onViewVersion(version.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Status indicator */}
                            <div className={`p-2 rounded-lg ${
                              version.active
                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}>
                              {version.active ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Hash className="w-4 h-4 text-slate-500" />
                              )}
                            </div>

                            {/* Version info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  Version {version.version}
                                </span>
                                {version.active && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>Created {formatDate(version.created_at)}</span>
                                </div>

                                {version.rotation_reason && (
                                  <div className="text-slate-600 dark:text-slate-400">
                                    <span className="font-medium">Reason:</span> {version.rotation_reason}
                                  </div>
                                )}

                                {version.grace_period_ends_at && (
                                  <div className={`flex items-center gap-2 ${
                                    formatGracePeriodEnd(version.grace_period_ends_at)?.isExpired
                                      ? 'text-slate-500 dark:text-slate-500'
                                      : 'text-amber-600 dark:text-amber-400'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      Grace period {formatGracePeriodEnd(version.grace_period_ends_at)?.isExpired ? 'expired' : 'ends'}:{' '}
                                      {formatGracePeriodEnd(version.grace_period_ends_at)?.date}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Arrow indicator */}
                          <div className="text-slate-400">
                            <XIcon className="w-5 h-5 transform -rotate-45" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
