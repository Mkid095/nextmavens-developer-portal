/**
 * Webhook Processor Types
 */

/**
 * Webhook processor job result interface
 */
export interface WebhookProcessorResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of pending events processed */
  eventsProcessed: number
  /** Number of successful deliveries */
  deliveriesSucceeded: number
  /** Number of failed deliveries */
  deliveriesFailed: number
  /** Number of webhooks auto-disabled */
  webhooksDisabled: number
  /** Details of processed events */
  processedEvents: Array<{
    eventLogId: string
    webhookId: string
    eventType: string
    status: 'delivered' | 'failed'
    retryCount: number
  }>
  /** Error message if job failed */
  error?: string
}

export interface EventLogEntry {
  id: string
  project_id: string
  webhook_id: string
  event_type: string
  payload: unknown
  retry_count?: number
  created_at: Date
}

export interface DeliveryProcessResult {
  status: 'delivered' | 'failed'
  statusCode?: number
  error?: string
  webhookDisabled: boolean
}
