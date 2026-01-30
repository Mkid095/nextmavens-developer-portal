'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Clock,
  RefreshCw,
  Play,
  Bell,
  Eye,
  EyeOff,
  X,
  History,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import type {
  Webhook,
  EventType,
  CreateWebhookRequest,
  EventLog,
} from '@/lib/types/webhook.types'

const EVENT_TYPES: EventType[] = [
  'project.created',
  'project.suspended',
  'project.deleted',
  'user.signedup',
  'user.deleted',
  'file.uploaded',
  'file.deleted',
  'key.created',
  'key.rotated',
  'key.revoked',
  'function.executed',
  'usage.threshold',
]

interface CreateWebhookForm {
  event: string
  target_url: string
  enabled: boolean
}

export default function WebhooksPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [project, setProject] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<CreateWebhookForm>({
    event: '',
    target_url: '',
    enabled: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ webhookId: string; success: boolean; message: string } | null>(null)

  // Webhook history state
  const [showHistory, setShowHistory] = useState(false)
  const [eventLogs, setEventLogs] = useState<EventLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'delivered' | 'failed' | 'pending'>('all')
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)

  const client = getControlPlaneClient()

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const headers = { headers: { get: (name: string) => {
          if (name === 'authorization') {
            // Get token from localStorage
            if (typeof window !== 'undefined') {
              return localStorage.getItem('token') || ''
            }
          }
          return null
        }}}

        const response = await fetch('/api/projects/by-slug/' + slug)
        if (response.ok) {
          const data = await response.json()
          setProject(data.project)
        }
      } catch (err) {
        console.error('Failed to fetch project:', err)
      }
    }

    if (slug) {
      fetchProject()
    }
  }, [slug])

  // Fetch webhooks
  useEffect(() => {
    const fetchWebhooks = async () => {
      if (!project?.id) return

      try {
        setLoading(true)
        const headers = { headers: { get: (name: string) => {
          if (name === 'authorization') {
            if (typeof window !== 'undefined') {
              return localStorage.getItem('token') || ''
            }
          }
          return null
        }}}

        const response = await client.listWebhooks({ project_id: project.id }, headers)
        if (response.success) {
          setWebhooks(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch webhooks:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch webhooks')
      } finally {
        setLoading(false)
      }
    }

    fetchWebhooks()
  }, [project?.id, client])

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project?.id) return

    setSubmitting(true)
    setError(null)

    try {
      const headers = { headers: { get: (name: string) => {
        if (name === 'authorization') {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || ''
          }
        }
        return null
      }}}

      const request: CreateWebhookRequest = {
        project_id: project.id,
        event: createForm.event,
        target_url: createForm.target_url,
        enabled: createForm.enabled,
      }

      const response = await client.createWebhook(request, headers)
      if (response.success) {
        setNewWebhookSecret(response.data.secret)
        // Refresh webhooks list
        const updatedWebhooks = await client.listWebhooks({ project_id: project.id }, headers)
        if (updatedWebhooks.success) {
          setWebhooks(updatedWebhooks.data)
        }
        // Reset form
        setCreateForm({ event: '', target_url: '', enabled: true })
        setShowCreateForm(false)
      }
    } catch (err) {
      console.error('Failed to create webhook:', err)
      setError(err instanceof Error ? err.message : 'Failed to create webhook')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleWebhook = async (webhook: Webhook) => {
    try {
      const headers = { headers: { get: (name: string) => {
        if (name === 'authorization') {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || ''
          }
        }
        return null
      }}}

      await client.updateWebhook(webhook.id, { enabled: !webhook.enabled }, headers)
      // Refresh webhooks list
      const updatedWebhooks = await client.listWebhooks({ project_id: project!.id }, headers)
      if (updatedWebhooks.success) {
        setWebhooks(updatedWebhooks.data)
      }
    } catch (err) {
      console.error('Failed to toggle webhook:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle webhook')
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const headers = { headers: { get: (name: string) => {
        if (name === 'authorization') {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || ''
          }
        }
        return null
      }}}

      await client.deleteWebhook(webhookId, headers)
      // Refresh webhooks list
      const updatedWebhooks = await client.listWebhooks({ project_id: project!.id }, headers)
      if (updatedWebhooks.success) {
        setWebhooks(updatedWebhooks.data)
      }
    } catch (err) {
      console.error('Failed to delete webhook:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete webhook')
    }
  }

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhookId(webhookId)
    setTestResult(null)

    try {
      const headers = { headers: { get: (name: string) => {
        if (name === 'authorization') {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || ''
          }
        }
        return null
      }}}

      const response = await client.testWebhook({ webhook_id: webhookId }, headers)
      setTestResult({
        webhookId,
        success: response.success,
        message: response.message,
      })
    } catch (err) {
      console.error('Failed to test webhook:', err)
      setTestResult({
        webhookId,
        success: false,
        message: err instanceof Error ? err.message : 'Failed to test webhook',
      })
    } finally {
      setTestingWebhookId(null)
    }
  }

  const fetchEventLogs = async (webhookId?: string) => {
    if (!project?.id) return

    setHistoryLoading(true)
    try {
      const headers = { headers: { get: (name: string) => {
        if (name === 'authorization') {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || ''
          }
        }
        return null
      }}}

      const query: any = { project_id: project.id }
      if (webhookId) {
        query.webhook_id = webhookId
      }
      if (historyFilter !== 'all') {
        query.status = historyFilter
      }

      const response = await client.listEventLogs(query, headers)
      if (response.success) {
        setEventLogs(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch event logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event logs')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleShowHistory = (webhookId?: string) => {
    setSelectedWebhookId(webhookId || null)
    setShowHistory(true)
    fetchEventLogs(webhookId)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
    setSelectedWebhookId(null)
    setEventLogs([])
  }

  const handleRetryFailedWebhooks = async () => {
    // This would call an API endpoint to retry failed webhook deliveries
    // For now, just refresh the history
    fetchEventLogs(selectedWebhookId || undefined)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/projects/${slug}`}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Webhooks</h1>
                {project && (
                  <p className="text-sm text-slate-400">
                    Project: {project.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleShowHistory()}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <History className="h-4 w-4" />
                View History
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-900/20 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Secret Display Modal */}
        {newWebhookSecret && (
          <div className="mb-6 rounded-lg border border-blue-900/50 bg-blue-900/20 p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-200 mb-2">Webhook Created Successfully</h3>
                <p className="text-sm text-blue-300 mb-4">
                  Your webhook has been created. Copy the secret below and store it securely. You won't be able to see it again.
                </p>
                <div className="relative">
                  <code className="block w-full rounded-lg bg-slate-950 p-3 text-sm text-blue-200 break-all">
                    {newWebhookSecret}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newWebhookSecret)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewWebhookSecret(null)}
                className="text-blue-400 hover:text-blue-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Create Webhook Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Create New Webhook</h2>
            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Event Type
                </label>
                <select
                  value={createForm.event}
                  onChange={(e) => setCreateForm({ ...createForm, event: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an event type</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target URL
                </label>
                <input
                  type="url"
                  value={createForm.target_url}
                  onChange={(e) => setCreateForm({ ...createForm, target_url: e.target.value })}
                  placeholder="https://your-server.com/webhooks"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  The URL where webhook events will be sent
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-300">Enable Webhook</label>
                  <p className="text-xs text-slate-500">
                    When enabled, this webhook will receive events
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateForm({ ...createForm, enabled: !createForm.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    createForm.enabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  {createForm.enabled ? (
                    <ToggleRight className="h-6 w-6 translate-x-5 text-white" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !createForm.event || !createForm.target_url}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Webhook
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Webhooks List */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Active Webhooks</h2>
            <p className="text-sm text-slate-400 mt-1">
              Manage webhooks for this project
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Webhooks Yet</h3>
              <p className="text-sm text-slate-400 mb-4">
                Create your first webhook to start receiving event notifications
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Webhook
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
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

                      {/* View History Button */}
                      <div className="mt-3">
                        <button
                          onClick={() => handleShowHistory(webhook.id)}
                          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <History className="h-3.5 w-3.5" />
                          View History
                        </button>
                      </div>

                      {/* Test Result */}
                      {testResult?.webhookId === webhook.id && (
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
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={testingWebhookId === webhook.id || !webhook.enabled}
                        className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Test webhook"
                      >
                        {testingWebhookId === webhook.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleWebhook(webhook)}
                        className={`rounded-lg border p-2 transition-colors ${
                          webhook.enabled
                            ? 'border-green-900/50 text-green-400 hover:bg-green-900/20'
                            : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                        title={webhook.enabled ? 'Disable webhook' : 'Enable webhook'}
                      >
                        {webhook.enabled ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="rounded-lg border border-red-900/50 p-2 text-red-400 hover:bg-red-900/20 transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
          <h3 className="text-sm font-semibold text-white mb-3">About Webhooks</h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Webhooks are sent as POST requests to your target URL with a JSON payload</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Each webhook includes a signature header (X-Webhook-Signature) for verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Webhooks are retried up to 5 times with exponential backoff on failure</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>After 5 consecutive failures, a webhook is automatically disabled</span>
            </li>
          </ul>
        </div>

        {/* Webhook History Section */}
        {showHistory && (
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
                  onClick={handleCloseHistory}
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
                      onClick={() => {
                        setHistoryFilter(status)
                        fetchEventLogs(selectedWebhookId || undefined)
                      }}
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
                  {historyFilter === 'failed' && (
                    <button
                      onClick={handleRetryFailedWebhooks}
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
