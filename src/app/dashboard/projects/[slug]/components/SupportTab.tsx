import { Plus, LifeBuoy, AlertCircle } from 'lucide-react'
import type { SupportRequest } from '../hooks'

interface SupportTabProps {
  projectId: string
  supportRequests: SupportRequest[]
  supportRequestsLoading: boolean
  supportRequestsError: string | null
  supportStatusFilter: string
  onSetSupportStatusFilter: (status: string) => void
  onOpenCreateModal: () => void
  onViewRequestDetails: (requestId: string) => void
}

export function SupportTab({
  projectId,
  supportRequests,
  supportRequestsLoading,
  supportRequestsError,
  supportStatusFilter,
  onSetSupportStatusFilter,
  onOpenCreateModal,
  onViewRequestDetails,
}: SupportTabProps) {
  const statusOptions = ['all', 'open', 'in_progress', 'resolved', 'closed']

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800' },
    closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Support Requests</h2>
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Request</span>
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">Filter by status:</span>
        <div className="flex gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => onSetSupportStatusFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                supportStatusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Support Requests List */}
      {supportRequestsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : supportRequestsError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{supportRequestsError}</span>
        </div>
      ) : supportRequests.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <LifeBuoy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No support requests</h3>
          <p className="text-slate-600 mb-4">
            {supportStatusFilter === 'all'
              ? "You haven't created any support requests yet."
              : `No ${supportStatusFilter} requests found.`}
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Your First Request
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Resolved</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {supportRequests.map((request) => {
                const status = statusConfig[request.status] || statusConfig.open
                return (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{request.subject}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{request.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {request.resolved_at ? new Date(request.resolved_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewRequestDetails(request.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
