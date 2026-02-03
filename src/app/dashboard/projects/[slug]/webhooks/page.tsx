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
    setHistoryFilter,
    handleCreateWebhook,
    handleToggleWebhook,
    handleDeleteWebhook,
    handleTestWebhook,
    handleShowHistory,
    handleCloseHistory,
    handleRetryFailedWebhooks,
    handleRetrySingleWebhook,
  } = useWebhooks()

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
