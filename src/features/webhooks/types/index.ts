/**
 * Webhook Types
 *
 * Type definitions for webhook system
 */

/**
 * Webhook configuration stored in database
 */
export interface Webhook {
  id: string
  project_id: string
  event: string
  target_url: string
  secret: string
  enabled: boolean
  consecutive_failures: number
  created_at: Date
  updated_at: Date
}

/**
 * Event log entry stored in database
 */
export interface EventLog {
  id: string
  project_id: string
  webhook_id: string | null
  event_type: string
  payload: Record<string, unknown>
  status: 'pending' | 'delivered' | 'failed'
  response_code: number | null
  response_body: string | null
  retry_count: number
  delivered_at: Date | null
  created_at: Date
}

/**
 * Event types that can trigger webhooks
 *
 * US-003: Define Event Types (from webhooks-events PRD)
 */
export type EventType =
  | 'project.created'
  | 'project.suspended'
  | 'project.deleted'
  | 'user.signedup'
  | 'user.deleted'
  | 'file.uploaded'
  | 'file.deleted'
  | 'key.created'
  | 'key.rotated'
  | 'key.revoked'
  | 'function.executed'
  | 'usage.threshold'

/**
 * Webhook delivery result
 */
export interface WebhookDeliveryResult {
  success: boolean
  statusCode?: number
  error?: string
}

/**
 * Options for delivering webhooks
 */
export interface WebhookDeliveryOptions {
  /**
   * Maximum number of retry attempts
   * Default: 5
   */
  maxRetries?: number

  /**
   * Request timeout in milliseconds
   * Default: 30000 (30 seconds)
   */
  timeout?: number
}
