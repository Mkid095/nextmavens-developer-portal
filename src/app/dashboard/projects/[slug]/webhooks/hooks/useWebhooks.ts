/**
 * useWebhooks Hook
 *
 * Manages all webhook state and operations for the webhooks page.
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import type {
  Webhook,
  CreateWebhookRequest,
  EventLog,
} from '@/lib/types/webhook.types'
import { createAuthHeaders } from '../utils'
import { useWebhookRetries } from './useWebhookRetries'

export interface UseWebhooksResult {
  // State
  project: { id: string; name: string; slug: string } | null
  webhooks: Webhook[]
  loading: boolean
  showCreateForm: boolean
  createForm: { event: string; target_url: string; enabled: boolean }
  submitting: boolean
  newWebhookSecret: string | null
  error: string | null
  testingWebhookId: string | null
  testResult: { webhookId: string; success: boolean; message: string } | null
  showHistory: boolean
  eventLogs: EventLog[]
  historyLoading: boolean
  historyFilter: 'all' | 'delivered' | 'failed' | 'pending'
  selectedWebhookId: string | null

  // Actions
  setShowCreateForm: (show: boolean) => void
  setCreateForm: (form: any) => void
  setError: (error: string | null) => void
  setNewWebhookSecret: (secret: string | null) => void
  handleCreateWebhook: (e: React.FormEvent) => Promise<void>
  handleToggleWebhook: (webhook: Webhook) => Promise<void>
  handleDeleteWebhook: (webhookId: string) => Promise<void>
  handleTestWebhook: (webhookId: string) => Promise<void>
  handleShowHistory: (webhookId?: string) => void
  handleCloseHistory: () => void
  handleRetryFailedWebhooks: () => Promise<void>
  handleRetrySingleWebhook: (eventLogId: string) => Promise<void>
  setHistoryFilter: (filter: any) => void
}

export function useWebhooks(): UseWebhooksResult {
  const params = useParams()
  const slug = params.slug as string
  const client = getControlPlaneClient()

  // State
  const [project, setProject] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    event: '',
    target_url: '',
    enabled: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ webhookId: string; success: boolean; message: string } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [eventLogs, setEventLogs] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'delivered' | 'failed' | 'pending'>('all')
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
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
        const headers = createAuthHeaders()
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

  const handleCreateWebhook = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project?.id) return

    setSubmitting(true)
    setError(null)

    try {
      const headers = createAuthHeaders()
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
  }, [project, createForm, client])

  const handleToggleWebhook = useCallback(async (webhook: Webhook) => {
    try {
      const headers = createAuthHeaders()
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
  }, [project, client])

  const handleDeleteWebhook = useCallback(async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const headers = createAuthHeaders()
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
  }, [project, client])

  const handleTestWebhook = useCallback(async (webhookId: string) => {
    setTestingWebhookId(webhookId)
    setTestResult(null)

    try {
      const headers = createAuthHeaders()
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
  }, [])

  const fetchEventLogs = useCallback(async (webhookId?: string) => {
    if (!project?.id) return

    setHistoryLoading(true)
    try {
      const headers = createAuthHeaders()
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
  }, [project, historyFilter, client])

  const handleShowHistory = useCallback((webhookId?: string) => {
    setSelectedWebhookId(webhookId || null)
    setShowHistory(true)
    fetchEventLogs(webhookId)
  }, [fetchEventLogs])

  const handleCloseHistory = useCallback(() => {
    setShowHistory(false)
    setSelectedWebhookId(null)
    setEventLogs([])
  }, [])

  // Use the retry hook for retry operations
  const { handleRetryFailedWebhooks, handleRetrySingleWebhook } = useWebhookRetries({
    project,
    eventLogs,
    selectedWebhookId,
    onFetchEventLogs: () => fetchEventLogs(selectedWebhookId || undefined),
    onSetTestResult: setTestResult,
    onSetError: setError,
  })

  return {
    project,
    webhooks,
    loading,
    showCreateForm,
    createForm,
    submitting,
    newWebhookSecret,
    error,
    testingWebhookId,
    testResult,
    showHistory,
    eventLogs,
    historyLoading,
    historyFilter,
    selectedWebhookId,
    setShowCreateForm,
    setCreateForm,
    setError,
    setNewWebhookSecret,
    handleCreateWebhook,
    handleToggleWebhook,
    handleDeleteWebhook,
    handleTestWebhook,
    handleShowHistory,
    handleCloseHistory,
    handleRetryFailedWebhooks,
    handleRetrySingleWebhook,
    setHistoryFilter,
  }
}
