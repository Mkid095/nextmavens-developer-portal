'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  LifeBuoy,
  Send,
  AlertCircle,
  Check,
  FileText,
  Activity,
  Database,
  AlertTriangle,
} from 'lucide-react'

interface SupportRequestModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

interface SupportContext {
  project: {
    id: string
    name: string
    status: string
    tenant_slug: string
  }
  recent_errors: Array<{
    id: string
    timestamp: string
    service: string
    message: string
  }>
  usage_metrics: Record<string, {
    current_usage: number
    monthly_limit: number
    usage_percentage: number
  }>
  logs_snippet: Array<{
    id: string
    timestamp: string
    service: string
    level: string
    message: string
  }>
}

interface SubmitResponse {
  request_id: string
  status: string
}

export default function SupportRequestModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: SupportRequestModalProps) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [context, setContext] = useState<SupportContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSubject('')
      setDescription('')
      setError('')
      setSuccess(false)
      setRequestId(null)
      loadContext()
    }
  }, [isOpen, projectId])

  const loadContext = async () => {
    setLoadingContext(true)
    try {
      // We'll show what context will be attached based on the API documentation
      setContext({
        project: {
          id: projectId,
          name: projectName,
          status: 'active',
          tenant_slug: 'your-tenant',
        },
        recent_errors: [],
        usage_metrics: {},
        logs_snippet: [],
      })
    } catch (err) {
      console.error('Failed to load context:', err)
    } finally {
      setLoadingContext(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || description.length < 10) {
      setError('Please provide a subject and a description (at least 10 characters)')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/support/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          subject: subject.trim(),
          description: description.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create support request')
      }

      const data: SubmitResponse = await response.json()
      setRequestId(data.request_id)
      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset after animation completes
    setTimeout(() => {
      setSubject('')
      setDescription('')
      setError('')
      setSuccess(false)
      setRequestId(null)
    }, 300)
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <LifeBuoy className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Request Support</h2>
                  <p className="text-sm text-slate-500">
                    {success ? 'Request submitted' : 'Get help from our support team'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {success ? (
                // Success State
                <div className="space-y-6">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">Support Request Created!</h3>
                    <p className="text-slate-600">
                      Your support request has been submitted successfully.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Request ID</span>
                      <span className="text-sm font-mono text-emerald-700">{requestId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Status</span>
                      <span className="text-sm px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">Open</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">What happens next?</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Our support team will review your request</li>
                          <li>• You'll receive an email notification when status changes</li>
                          <li>• Context from your project has been automatically attached</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full px-6 py-3 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                // Form State
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Database className="w-4 h-4 text-slate-600" />
                      <span className="font-medium text-slate-900">Project:</span>
                      <span className="text-slate-600">{projectName}</span>
                    </div>
                  </div>

                  {/* Context Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold text-blue-900 text-sm">Context That Will Be Attached</h4>
                    </div>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        Project information (ID, name, status)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        Recent errors (last 10)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        Current usage metrics
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3 h-3" />
                        Recent logs snippet (last 20 lines)
                      </li>
                    </ul>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of your issue"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                      autoFocus
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe your issue in detail. Include any relevant steps, error messages, or expected behavior."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent min-h-[150px] resize-none"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Minimum 10 characters
                    </p>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <div className="flex-1" />
                    <button
                      type="submit"
                      disabled={submitting || !subject.trim() || description.length < 10}
                      className="px-6 py-3 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
