/**
 * Admin Support Dashboard
 *
 * Admin interface for managing support requests.
 * Lists all open requests with filtering, viewing details, updating status, and adding notes.
 *
 * US-010: Create Admin Support UI
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  LifeBuoy,
  Filter,
  RefreshCw,
  Search,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type Status = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'

interface SupportRequest {
  id: string
  project_id: string
  project_name: string
  tenant_slug: string
  user_id: string
  user_email: string
  user_name: string
  subject: string
  description: string
  context: any
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  previous_status: string | null
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
}

interface SupportRequestsResponse {
  requests: SupportRequest[]
  total: number
}

interface StatusBadgeProps {
  status: string
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    open: {
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      icon: AlertCircle,
      label: 'OPEN',
    },
    in_progress: {
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      icon: Clock,
      label: 'IN PROGRESS',
    },
    resolved: {
      color: 'text-green-700',
      bg: 'bg-green-100',
      icon: CheckCircle,
      label: 'RESOLVED',
    },
    closed: {
      color: 'text-gray-700',
      bg: 'bg-gray-100',
      icon: XCircle,
      label: 'CLOSED',
    },
  }

  const cfg = config[status] || config.open
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

interface RequestDetailModalProps {
  request: SupportRequest
  onClose: () => void
  onUpdate: () => void
}

function RequestDetailModal({ request, onClose, onUpdate }: RequestDetailModalProps) {
  const [status, setStatus] = useState(request.status)
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/support/requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update support request')
      }

      toast.success('Support request updated successfully')
      onUpdate()
      onClose()
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to update support request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Support Request Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-3">
            <StatusBadge status={request.status} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.subject}</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* User & Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                User
              </div>
              <p className="text-sm text-gray-900">{request.user_name}</p>
              <p className="text-xs text-gray-500">{request.user_email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                Project
              </div>
              <p className="text-sm text-gray-900">{request.project_name}</p>
              <p className="text-xs text-gray-500">{request.tenant_slug}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4" />
                Created
              </div>
              <p className="text-sm text-gray-900">
                {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
            {request.resolved_at && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  Resolved
                </div>
                <p className="text-sm text-gray-900">
                  {new Date(request.resolved_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Context */}
          {request.context && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Attached Context</h4>
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                  View Full Context (JSON)
                </summary>
                <pre className="mt-2 p-3 bg-white rounded border overflow-x-auto text-xs">
                  {JSON.stringify(request.context, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Admin Controls */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Update Status</h4>
            <div className="flex gap-2">
              {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Internal)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add internal notes about this support request..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Updating...' : 'Update Request'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<Status>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 20

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const res = await fetch(`/api/admin/support/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch support requests')
      }

      const data: SupportRequestsResponse = await res.json()
      setRequests(data.requests)
      setTotal(data.total)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Failed to fetch support requests')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, page])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0)
  }, [selectedStatus])

  const filteredRequests = requests.filter((req) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      req.subject.toLowerCase().includes(query) ||
      req.user_email.toLowerCase().includes(query) ||
      req.project_name.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <LifeBuoy className="w-8 h-8 text-blue-600" />
                Admin Support Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and respond to user support requests
              </p>
            </div>
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex gap-1">
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all'
                      ? 'All'
                      : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject, email, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading support requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No support requests found</p>
          </div>
        ) : (
          <>
            {/* Requests List */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  variants={item}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {request.subject}
                          </h3>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {request.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {request.user_name} ({request.user_email})
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {request.project_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(request.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of{' '}
                  {total} requests
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={fetchRequests}
        />
      )}
    </div>
  )
}
