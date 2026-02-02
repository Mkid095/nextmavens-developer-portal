/**
 * Webhook List Component
 * Displays list of project webhooks
 */

import { Globe, Clock, Play, Eye, EyeOff, XCircle, Bell, Loader2, Trash2 } from 'lucide-react'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import type { Webhook } from '@/lib/types/webhook.types'
import { getAuthToken } from '../utils'
import { formatDate } from '../utils'

interface WebhookListProps {
  webhooks: Webhook[]
  loading: boolean
  onCreateWebhook: () => void
  onToggleWebhook: (webhook: Webhook) => Promise<void>
  onDeleteWebhook: (webhookId: string) => void
  onTestWebhook: (webhookId: string) => void
  testingWebhookId: string | null
  testResult: { webhookId: string; success: boolean; message: string } | null
}

export function WebhookList({
  webhooks,
  loading,
  onCreateWebhook,
  onToggleWebhook,
  onDeleteWebhook,
  onTestWebhook,
  testingWebhookId,
  testResult,
}: WebhookListProps) {
  const client = getControlPlaneClient()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (webhooks.length === 0) {
    return (
      <div className="py-12 text-center">
        <Bell className="mx-auto h-12 w-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Webhooks Yet</h3>
        <p className="text-sm text-slate-400 mb-4">
          Create your first webhook to start receiving event notifications
        </p>
        <button
          onClick={onCreateWebhook}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Webhook
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50">
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">Active Webhooks</h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage webhooks for this project
        </p>
      </div>

      <div className="divide-y divide-slate-800">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
            <WebhookItem
              webhook={webhook}
              onToggle={() => onToggleWebhook(webhook)}
              onDelete={() => onDeleteWebhook(webhook.id)}
              onTest={() => onTestWebhook(webhook.id)}
              testing={testingWebhookId === webhook.id}
              testResult={testResult?.webhookId === webhook.id ? testResult : null}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface WebhookItemProps {
  webhook: Webhook
  onToggle: () => void
  onDelete: () => void
  onTest: () => void
  testing: boolean
  testResult: { webhookId: string; success: boolean; message: string } | null
}

function WebhookItem({
  webhook,
  onToggle,
  onDelete,
  onTest,
  testing,
  testResult,
}: {
  webhook: Webhook
  onToggle: () => void
  onDelete: () => void
  onTest: () => void
  testing: boolean
  testResult: { webhookId: string; success: boolean; message: string } | null
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center rounded-md bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-300">
            {webhook.event}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              webhook.enabled
                ? 'bg-green-900/30 text-green-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {webhook.enabled ? (
              <>
                <Eye className="h-3 w-3" />
                Enabled
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                Disabled
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <Globe className="h-4 w-4 flex-shrink-0" />
          <code className="text-xs break-all">{webhook.target_url}</code>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Created {formatDate(webhook.created_at)}
          </div>
          {webhook.consecutive_failures !== undefined && webhook.consecutive_failures > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <XCircle className="h-3.5 w-3.5" />
              {webhook.consecutive_failures} consecutive failures
            </div>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${
            testResult.success
              ? 'bg-green-900/20 border border-green-900/50 text-green-300'
              : 'bg-red-900/20 border border-red-900/50 text-red-300'
          }`}>
            {testResult.message}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onTest}
          disabled={testing || !webhook.enabled}
          className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Test webhook"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={onToggle}
          className={`rounded-lg border p-2 transition-colors ${
            webhook.enabled
              ? 'border-green-900/50 text-green-400 hover:bg-green-900/20'
              : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
          title={webhook.enabled ? 'Disable webhook' : 'Enable webhook'}
        >
          {webhook.enabled ? (
            <span className="h-4 w-4" />
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={onDelete}
          className="rounded-lg border border-red-900/50 p-2 text-red-400 hover:bg-red-900/20 transition-colors"
          title="Delete webhook"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

