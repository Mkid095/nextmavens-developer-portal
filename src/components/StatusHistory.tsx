'use client'

import { useEffect, useState } from 'react'
import { Clock, ArrowRight, User, Mail, AlertCircle, Info, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

/**
 * Status change history entry interface
 */
interface StatusHistoryEntry {
  id: string
  action: string
  previous_status: string | null
  new_status: string
  reason: string | null
  actor_id: string
  actor_type: string
  actor_name: string | null
  actor_email: string | null
  created_at: string
}

/**
 * API response interface
 */
interface StatusHistoryResponse {
  project: {
    id: string
    name: string
    status: string
  }
  history: StatusHistoryEntry[]
  total_entries: number
  resolution_steps: string[]
}

/**
 * Props for StatusHistory component
 */
interface StatusHistoryProps {
  /** The project ID */
  projectId: string
  /** Optional CSS class name */
  className?: string
}

/**
 * Format status string to display format
 */
function formatStatus(status: string): string {
  return status.toUpperCase()
}

/**
 * Get status color class
 */
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'suspended':
      return 'text-red-700 bg-red-50 border-red-200'
    case 'archived':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    case 'deleted':
      return 'text-gray-700 bg-gray-50 border-gray-200'
    case 'created':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200'
  }
}

/**
 * Format actor type for display
 */
function formatActorType(actorType: string): string {
  switch (actorType) {
    case 'user':
      return 'User'
    case 'system':
      return 'System'
    case 'api_key':
      return 'API Key'
    default:
      return actorType
  }
}

/**
 * StatusHistory Component
 *
 * Displays the status change history for a project.
 * Shows previous status, new status, reason, timestamp, and actor information.
 * Links to audit log entries and explains how to resolve suspension.
 *
 * PRD: US-009 - Show Status Change History
 * - Status history section in project settings
 * - Shows previous status, new status, reason, timestamp
 * - Links to audit log entries
 * - Explains how to resolve suspension
 */
export default function StatusHistory({ projectId, className = '' }: StatusHistoryProps) {
  const [data, setData] = useState<StatusHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatusHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('accessToken')
        const res = await fetch(`/api/projects/${projectId}/status-history`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to fetch status history')
        }

        const responseData = await res.json()
        setData(responseData)
      } catch (err: any) {
        console.error('Failed to fetch status history:', err)
        setError(err.message || 'Failed to fetch status history')
      } finally {
        setLoading(false)
      }
    }

    fetchStatusHistory()
  }, [projectId])

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-slate-600">Loading status history...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load status history</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.history.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-slate-600">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">No status changes recorded for this project yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status History List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-900">Status Change History</h3>
          <p className="text-sm text-slate-600 mt-1">
            Track all status changes with reasons and timestamps
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {data.history.map((entry) => (
            <div key={entry.id} className="p-6 hover:bg-slate-50 transition-colors">
              {/* Status Change Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Status Transition */}
                  <div className="flex items-center gap-3 mb-3">
                    {entry.previous_status && (
                      <>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.previous_status)}`}
                        >
                          {formatStatus(entry.previous_status)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.new_status)}`}
                    >
                      {formatStatus(entry.new_status)}
                    </span>
                  </div>

                  {/* Action Description */}
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {entry.action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>

                  {/* Reason */}
                  {entry.reason && (
                    <p className="text-sm text-slate-600 mb-2">{entry.reason}</p>
                  )}

                  {/* Actor Information */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {entry.actor_name || 'Unknown'} ({formatActorType(entry.actor_type)})
                      </span>
                    </div>
                    {entry.actor_email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{entry.actor_email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Log Link */}
                <a
                  href={`/dashboard/audit?target_id=${entry.id}`}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 transition-colors flex-shrink-0"
                  title="View in audit log"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Audit Log</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Total Entries Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing {data.history.length} status change{data.history.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Resolution Steps for Suspended/Archived/Deleted Projects */}
      {data.resolution_steps && data.resolution_steps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">
                How to Resolve This Status
              </h4>
              <ul className="space-y-1.5">
                {data.resolution_steps.map((step, index) => (
                  <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-600 flex-shrink-0">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              {/* Request Review Button for Suspended Projects */}
              {data.project.status === 'suspended' && (
                <div className="mt-4 pt-4 border-t border-amber-300">
                  <button className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
                    Request Review
                  </button>
                  <p className="text-xs text-amber-700 mt-2">
                    Our team will review your suspension and respond within 24-48 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
