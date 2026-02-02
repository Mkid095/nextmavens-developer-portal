/**
 * Request Detail Modal Component
 * Modal for viewing and updating support request details
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { XCircle, User, FileText, Calendar, CheckCircle } from 'lucide-react'
import type { RequestDetailModalProps } from '../types'
import { StatusBadge } from './StatusBadge'

export function RequestDetailModal({ request, onClose, onUpdate }: RequestDetailModalProps) {
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
              <p className="text-sm text-gray-900">{new Date(request.created_at).toLocaleString()}</p>
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
