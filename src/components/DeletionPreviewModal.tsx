'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  AlertTriangle,
  Trash2,
  Database,
  Key,
  Webhook,
  HardDrive,
  Code2,
  Lock,
  Check,
  Calendar,
  Info,
} from 'lucide-react'

interface DeletionPreviewData {
  project: {
    id: string
    name: string
    slug: string
    status: string
    created_at: string
  }
  will_be_deleted: {
    schemas: number
    tables: number
    api_keys: Record<string, number>
    webhooks: number
    edge_functions: number
    storage_buckets: number
    secrets: number
  }
  dependencies: Array<{
    type: string
    target: string
    impact: string
  }>
  recoverable_until: string | null
}

interface DeletionPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onConfirmDelete: () => Promise<void>
}

const ICON_MAP = {
  database: Database,
  webhook: Webhook,
  storage: HardDrive,
  edge_function: Code2,
  secret: Lock,
}

const TYPE_LABELS: Record<string, string> = {
  database: 'Database Schema',
  webhook: 'Webhook',
  storage: 'Storage Bucket',
  edge_function: 'Edge Function',
  secret: 'Secret',
}

export default function DeletionPreviewModal({
  isOpen,
  onClose,
  projectId,
  onConfirmDelete,
}: DeletionPreviewModalProps) {
  const [preview, setPreview] = useState<DeletionPreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (isOpen && projectId) {
      fetchDeletionPreview()
    }
  }, [isOpen, projectId])

  const fetchDeletionPreview = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/deletion-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to load deletion preview' }))
        throw new Error(data.error || 'Failed to load deletion preview')
      }

      const data = await res.json()
      setPreview(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load deletion preview')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmed) {
      setError('Please confirm the deletion by checking the box')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await onConfirmDelete()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete project')
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTotalCount = () => {
    if (!preview) return 0
    const { will_be_deleted } = preview
    return (
      will_be_deleted.schemas +
      will_be_deleted.tables +
      Object.values(will_be_deleted.api_keys).reduce((a, b) => a + b, 0) +
      will_be_deleted.webhooks +
      will_be_deleted.edge_functions +
      will_be_deleted.storage_buckets +
      will_be_deleted.secrets
    )
  }

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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Delete Project</h2>
                  <p className="text-sm text-slate-600">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-100 rounded-lg transition"
                disabled={deleting}
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900">Error</h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : preview ? (
                <div className="space-y-6">
                  {/* Warning Banner */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900">Warning: Project Deletion</h3>
                        <p className="text-sm text-red-700 mt-1">
                          You are about to delete <strong>{preview.project.name}</strong>. This will affect{' '}
                          <strong>{getTotalCount()} resources</strong>. Review the details below before confirming.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Project Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-600">Project ID</span>
                        <p className="font-mono text-slate-900">{preview.project.id}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Slug</span>
                        <p className="font-mono text-slate-900">{preview.project.slug}</p>
                      </div>
                    </div>
                  </div>

                  {/* What Will Be Deleted */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Resources to be Deleted
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Schemas */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.schemas}</p>
                        <p className="text-xs text-slate-600">Database Schemas</p>
                      </div>

                      {/* Tables */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <Database className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                        <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.tables}</p>
                        <p className="text-xs text-slate-600">Database Tables</p>
                      </div>

                      {/* API Keys */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <Key className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <p className="text-2xl font-semibold text-slate-900">
                          {Object.values(preview.will_be_deleted.api_keys).reduce((a, b) => a + b, 0)}
                        </p>
                        <p className="text-xs text-slate-600">API Keys</p>
                      </div>

                      {/* Webhooks */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <Webhook className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.webhooks}</p>
                        <p className="text-xs text-slate-600">Webhooks</p>
                      </div>

                      {/* Edge Functions */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <Code2 className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                        <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.edge_functions}</p>
                        <p className="text-xs text-slate-600">Edge Functions</p>
                      </div>

                      {/* Storage Buckets */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <HardDrive className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.storage_buckets}</p>
                        <p className="text-xs text-slate-600">Storage Buckets</p>
                      </div>

                      {/* Secrets */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <Lock className="w-6 h-6 text-red-600 mx-auto mb-2" />
                        <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.secrets}</p>
                        <p className="text-xs text-slate-600">Secrets</p>
                      </div>
                    </div>

                    {/* API Keys Breakdown */}
                    {Object.keys(preview.will_be_deleted.api_keys).length > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-medium text-amber-900 mb-2">API Keys by Type:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(preview.will_be_deleted.api_keys).map(([type, count]) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded font-medium"
                            >
                              {type}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dependencies */}
                  {preview.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Dependencies and Impact
                      </h4>
                      <div className="space-y-2">
                        {preview.dependencies.map((dep, index) => {
                          const Icon = ICON_MAP[dep.type as keyof typeof ICON_MAP] || Info
                          const label = TYPE_LABELS[dep.type] || dep.type
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="p-1.5 bg-white rounded border border-slate-200">
                                <Icon className="w-4 h-4 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">{label}</p>
                                <p className="text-xs text-slate-500 truncate font-mono">{dep.target}</p>
                                <p className="text-sm text-red-600 mt-1">{dep.impact}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recovery Information */}
                  {preview.recoverable_until && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-emerald-900">Recoverable Until</h4>
                          <p className="text-sm text-emerald-700 mt-1">
                            Your project will be retained for <strong>30 days</strong> before permanent deletion.
                            You can restore it anytime before:{' '}
                            <strong>{formatDate(preview.recoverable_until)}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={deleting}
                  className="w-5 h-5 mt-0.5 text-red-600 rounded focus:ring-red-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-700">
                  I understand that this action cannot be undone and want to delete this project
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-white transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || !confirmed}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
