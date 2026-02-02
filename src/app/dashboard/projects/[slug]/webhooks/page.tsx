'use client'

import { useParams } from 'next/navigation'
import { useWebhooks } from './hooks/useWebhooks'
import { WebhookList, CreateWebhookForm, SecretDisplay, WebhookHistory, InfoSection } from './index'
import { WebhooksHeader } from './components/WebhooksHeader'
import { ErrorAlert } from './components/ErrorAlert'

export default function WebhooksPage() {
  const params = useParams()
  const slug = params.slug as string

  const {
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
  } = useWebhooks()

  const handleCreateWebhook = async (e: React.FormEvent) => {
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
  }

  const handleToggleWebhook = async (webhook: Webhook) => {
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
  }

  const handleDeleteWebhook = async (webhookId: string) => {
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
  }

  const handleTestWebhook = async (webhookId: string) => {
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
  }

  const fetchEventLogs = async (webhookId?: string) => {
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
    // Retry all failed webhook deliveries for the current filter
    const failedLogs = eventLogs.filter(log => log.status === 'failed')

    if (failedLogs.length === 0) {
      setError('No failed webhooks to retry')
      return
    }

    try {
      const headers = createAuthHeaders()

      // Retry each failed webhook delivery
      for (const log of failedLogs) {
        await client.retryWebhook({ event_log_id: log.id }, headers)
      }

      // Show success feedback
      setTestResult({
        webhookId: 'retry-all',
        success: true,
        message: `${failedLogs.length} webhook(s) queued for retry`,
      })

      // Refresh the history after retrying
      await fetchEventLogs(selectedWebhookId || undefined)
    } catch (err) {
      console.error('Failed to retry webhooks:', err)
      setError(err instanceof Error ? err.message : 'Failed to retry webhooks')
    }
  }

  const handleRetrySingleWebhook = async (eventLogId: string) => {
    try {
      const headers = createAuthHeaders()
      await client.retryWebhook({ event_log_id: eventLogId }, headers)

      // Show success feedback
      setTestResult({
        webhookId: 'retry',
        success: true,
        message: 'Webhook queued for retry',
      })

      // Refresh the history after retrying
      await fetchEventLogs(selectedWebhookId || undefined)
    } catch (err) {
      console.error('Failed to retry webhook:', err)
      setError(err instanceof Error ? err.message : 'Failed to retry webhook')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <WebhooksHeader
        slug={slug}
        projectName={project?.name}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        onShowHistory={handleShowHistory}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        {/* Secret Display Modal */}
        {newWebhookSecret && (
          <SecretDisplay
            secret={newWebhookSecret}
            onClose={() => setNewWebhookSecret(null)}
          />
        )}

        {/* Create Webhook Form */}
        {showCreateForm && project && (
          <CreateWebhookForm
            project={project}
            onSubmit={handleCreateWebhook}
            onCancel={() => setShowCreateForm(false)}
            onSubmitting={submitting}
          />
        )}

        {/* Webhooks List */}
        <WebhookList
          webhooks={webhooks}
          loading={loading}
          onCreateWebhook={() => setShowCreateForm(true)}
          onToggleWebhook={handleToggleWebhook}
          onDeleteWebhook={handleDeleteWebhook}
          onTestWebhook={handleTestWebhook}
          testingWebhookId={testingWebhookId}
          testResult={testResult}
        />

        {/* Info Section */}
        <InfoSection project={project} />

        {/* Webhook History Section */}
        {showHistory && (
          <WebhookHistory
            project={project!}
            selectedWebhookId={selectedWebhookId}
            eventLogs={eventLogs}
            historyLoading={historyLoading}
            historyFilter={historyFilter}
            onFilterChange={setHistoryFilter}
            onClose={handleCloseHistory}
            onRetrySingle={handleRetrySingleWebhook}
            onRetryAll={handleRetryFailedWebhooks}
            testResult={testResult}
          />
        )}
      </div>
    </div>
  )
}
