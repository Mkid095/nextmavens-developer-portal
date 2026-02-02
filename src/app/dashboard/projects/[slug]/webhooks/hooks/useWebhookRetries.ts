/**
 * useWebhookRetries Hook
 *
 * Handles webhook retry operations.
 */

import { useCallback } from 'react'
import { getControlPlaneClient } from '@/lib/api/control-plane-client'
import { createAuthHeaders } from '../utils'

interface UseWebhookRetriesOptions {
  project: { id: string; name: string; slug: string } | null
  eventLogs: any[]
  selectedWebhookId: string | null
  onFetchEventLogs: () => Promise<void>
  onSetTestResult: (result: { webhookId: string; success: boolean; message: string }) => void
  onSetError: (error: string | null) => void
}

export function useWebhookRetries({
  project,
  eventLogs,
  selectedWebhookId,
  onFetchEventLogs,
  onSetTestResult,
  onSetError,
}: UseWebhookRetriesOptions) {
  const client = getControlPlaneClient()

  const handleRetryFailedWebhooks = useCallback(async () => {
    const failedLogs = eventLogs.filter(log => log.status === 'failed')

    if (failedLogs.length === 0) {
      onSetError('No failed webhooks to retry')
      return
    }

    try {
      const headers = createAuthHeaders()

      for (const log of failedLogs) {
        await client.retryWebhook({ event_log_id: log.id }, headers)
      }

      onSetTestResult({
        webhookId: 'retry-all',
        success: true,
        message: `${failedLogs.length} webhook(s) queued for retry`,
      })

      await onFetchEventLogs()
    } catch (err) {
      console.error('Failed to retry webhooks:', err)
      onSetError(err instanceof Error ? err.message : 'Failed to retry webhooks')
    }
  }, [eventLogs, client, onFetchEventLogs, onSetTestResult, onSetError])

  const handleRetrySingleWebhook = useCallback(async (eventLogId: string) => {
    try {
      const headers = createAuthHeaders()
      await client.retryWebhook({ event_log_id: eventLogId }, headers)

      onSetTestResult({
        webhookId: 'retry',
        success: true,
        message: 'Webhook queued for retry',
      })

      await onFetchEventLogs()
    } catch (err) {
      console.error('Failed to retry webhook:', err)
      onSetError(err instanceof Error ? err.message : 'Failed to retry webhook')
    }
  }, [client, onFetchEventLogs, onSetTestResult, onSetError])

  return {
    handleRetryFailedWebhooks,
    handleRetrySingleWebhook,
  }
}
