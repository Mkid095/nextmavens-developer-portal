'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Info,
} from 'lucide-react'

interface SupportRequestDetailModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
}

interface Context {
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

interface SupportRequest {
  id: string
  project_id: string
  project_name: string
  user_id: string
  subject: string
  description: string
  context: Context
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  resolved_at: string | null
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: CheckCircle },
}

export default function SupportRequestDetailModal({
  isOpen,
  onClose,
  requestId,
}: SupportRequestDetailModalProps) {
  const [request, setRequest] = useState<SupportRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequest()
    }
  }, [isOpen, requestId])

  const fetchRequest = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/support/requests/${requestId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch support request')
      }
      const data = await res.json()
      setRequest(data.request)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-slate-900 truncate">Support Request Details</h2>
                  <p className="text-sm text-slate-500">{request?.id}</p>
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              ) : request ? (
                <div className="space-y-6">
                  {/* Status and Dates */}
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusConfig[request.status].color}}`}>
                      {statusConfig[request.status].label}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      Created {new Date(request.created_at).toLocaleString()}
                    </div>
                    {request.resolved_at && (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4" />
                        Resolved {new Date(request.resolved_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{request.subject}</h3>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.description}</p>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-slate-600" />
                      <h4 className="font-semibold text-slate-900 text-sm">Project</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-600">Name:</span>
                        <span className="ml-2 font-medium text-slate-900">{request.project_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Status:</span>
                        <span className="ml-2 font-medium text-slate-900">{request.context.project?.status || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attached Context */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold text-slate-900">Attached Context</h4>
                    </div>

                    {/* Project Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <h5 className="font-medium text-blue-900 text-sm mb-2">Project Information</h5>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div><span className="font-medium">ID:</span> {request.context.project?.id}</div>
                        <div><span className="font-medium">Name:</span> {request.context.project?.name}</div>
                        <div><span className="font-medium">Status:</span> {request.context.project?.status}</div>
                        <div><span className="font-medium">Tenant:</span> {request.context.project?.tenant_slug}</div>
                      </div>
                    </div>

                    {/* Recent Errors */}
                    {request.context.recent_errors && request.context.recent_errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                        <h5 className="font-medium text-red-900 text-sm mb-2">Recent Errors (Last 10)</h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {request.context.recent_errors.map((error, idx) => (
                            <div key={error.id || idx} className="text-xs text-red-800 border-b border-red-200 pb-2 last:border-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{error.service}</span>
                                <span className="text-red-600">{new Date(error.timestamp).toLocaleString()}</span>
                              </div>
                              <div>{error.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Usage Metrics */}
                    {request.context.usage_metrics && Object.keys(request.context.usage_metrics).length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-3">
                        <h5 className="font-medium text-emerald-900 text-sm mb-2">Current Usage Metrics</h5>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(request.context.usage_metrics).map(([service, metrics]) => (
                            <div key={service} className="text-xs text-emerald-800">
                              <div className="font-medium capitalize">{service}</div>
                              <div>
                                {metrics.current_usage} / {metrics.monthly_limit}
                                ({metrics.usage_percentage.toFixed(1)}%)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logs Snippet */}
                    {request.context.logs_snippet && request.context.logs_snippet.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h5 className="font-medium text-slate-900 text-sm mb-2">Recent Logs (Last 20)</h5>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {request.context.logs_snippet.map((log, idx) => (
                            <div key={log.id || idx} className="text-xs font-mono bg-slate-900 text-slate-300 p-2 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-slate-400'}>
                                  {log.level.toUpperCase()}
                                </span>
                                <span className="text-slate-500">{log.service}</span>
                                <span className="text-slate-600">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <div>{log.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
