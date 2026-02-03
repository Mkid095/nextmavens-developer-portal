/**
 * Webhook History Component
 * Displays webhook delivery history with filtering and retry
 */

import { motion } from 'framer-motion'
import {
  X,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
  Globe,
} from 'lucide-react'
import type { EventLog } from '@/lib/types/webhook.types'
import { getAuthToken } from './utils'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import { formatDate } from './utils'

interface WebhookHistoryProps {
  project: { id: string }
  selectedWebhookId: string | null
  eventLogs: EventLog[]
  historyLoading: boolean
  historyFilter: 'all' | 'delivered' | 'failed' | 'pending'
  onFilterChange: (filter: 'all' | 'delivered' | 'failed' | 'pending') => void
  onClose: () => void
  onRetrySingle: (eventLogId: string) => Promise<void>
  onRetryAll: () => Promise<void>
  testResult: { webhookId: string; success: boolean; message: string } | null
}

export function WebhookHistory({
  project,
  selectedWebhookId,
  eventLogs,
  historyLoading,
  historyFilter,
  onFilterChange,
  onClose,
  onRetrySingle,
  onRetryAll,
  testResult,
}: WebhookHistoryProps) {
  const client = getControlPlaneClient()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-lg border border-slate-800 bg-slate-900/50"
    >
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Webhook Delivery History</h2>
              <p className="text-sm text-slate-400">
                {selectedWebhookId ? 'History for selected webhook' : 'History for all webhooks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Filter by status:</span>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'delivered', 'failed', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => onFilterChange(status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  historyFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {testResult?.webhookId === 'retry-all' && (
              <div className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                testResult.success
                  ? 'bg-green-900/20 border border-green-900/50 text-green-300'
                  : 'bg-red-900/20 border border-red-900/50 text-red-300'
              }`}>
                {testResult.message}
              </div>
            )}
            {historyFilter === 'failed' && (
              <button
                onClick={onRetryAll}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Retry Failed
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : eventLogs.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No History Yet</h3>
            <p className="text-sm text-slate-400">
              Webhook delivery history will appear here once events are triggered
            </p>
          </div>
        ) : (
          eventLogs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
              <HistoryItem
                log={log}
                onRetry={onRetrySingle}
                canRetry={log.status === 'failed' && log.retry_count < 5}
              />
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

interface HistoryItemProps {
  log: EventLog
  onRetry: (eventLogId: string) => Promise<void>
  canRetry: boolean
}

function HistoryItem({ log, onRetry, canRetry }: HistoryItemProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center rounded-md bg-purple-900/30 px-2 py-1 text-xs font-medium text-purple-300">
            {log.event_type}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              log.status === 'delivered'
                ? 'bg-green-900/30 text-green-400'
                : log.status === 'failed'
                ? 'bg-red-900/30 text-red-400'
                : 'bg-yellow-900/30 text-yellow-400'
            }`}
          >
            {log.status === 'delivered' && <CheckCircle className="h-3 w-3" />}
            {log.status === 'failed' && <XCircle className="h-3 w-3" />}
            {log.status === 'pending' && <Clock className="h-3 w-3" />}
            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
          </span>
          {log.retry_count > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-400">
              <RefreshCw className="h-3 w-3" />
              Retry {log.retry_count}
            </span>
          )}
          {canRetry && (
            <button
              onClick={() => onRetry(log.id)}
              className="inline-flex items-center gap-1 rounded-md bg-orange-900/30 px-2 py-1 text-xs font-medium text-orange-300 hover:bg-orange-900/50 transition-colors"
              title="Retry this webhook delivery"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>

        {log.webhook && (
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Globe className="h-4 w-4 flex-shrink-0" />
            <code className="text-xs break-all">{log.webhook.target_url}</code>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(log.created_at)}
          </div>
          {log.response_code && (
            <div className="flex items-center gap-1">
              HTTP {log.response_code}
            </div>
          )}
          {log.delivered_at && (
            <div className="flex items-center gap-1">
              Delivered {formatDate(log.delivered_at)}
            </div>
          )}
        </div>

        {log.response_body && (
          <div className="mt-2">
            <details className="group">
              <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400">
                View response
              </summary>
              <pre className="mt-2 rounded bg-slate-950 p-3 text-xs text-slate-400 overflow-x-auto">
                {JSON.stringify(JSON.parse(log.response_body), null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Action button */}
      {canRetry && (
        <div className="flex-shrink-0">
          <button
            onClick={() => onRetry(log.id)}
            className="rounded-lg border border-orange-900/50 p-2 text-orange-400 hover:bg-orange-900/20 transition-colors"
            title="Retry this webhook delivery"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

import { History } from 'lucide-react'
