/**
 * Webhook Types
 * Type definitions for webhook system
 */

/**
 * Webhook configuration
 */
export interface Webhook {
  id: string
  project_id: string
  project_name?: string
  event: string
  target_url: string
  enabled: boolean
  consecutive_failures?: number
  created_at: string
  updated_at?: string
}

/**
 * Event log entry
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
  delivered_at: string | null
  created_at: string
}

/**
 * Event types that can trigger webhooks
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
  delivered?: boolean
  duration?: number
}

/**
 * Create webhook request
 */
export interface CreateWebhookRequest {
  project_id: string
  event: string
  target_url: string
  secret?: string
  enabled?: boolean
}

/**
 * Create webhook response
 */
export interface CreateWebhookResponse {
  id: string
  project_id: string
  event: string
  target_url: string
  enabled: boolean
  created_at: string
  secret: string
}

/**
 * Update webhook request
 */
export interface UpdateWebhookRequest {
  event?: string
  target_url?: string
  secret?: string
  enabled?: boolean
}

/**
 * List webhooks query parameters
 */
export interface ListWebhooksQuery {
  project_id?: string
  event?: string
  enabled?: boolean
  limit?: number
  offset?: number
}

/**
 * List webhooks response
 */
export interface ListWebhooksResponse {
  success: boolean
  data: Webhook[]
  meta?: {
    limit: number
    offset: number
  }
}

/**
 * Test webhook request
 */
export interface TestWebhookRequest {
  webhook_id: string
  test_payload?: Record<string, unknown>
}

/**
 * Test webhook response
 */
export interface TestWebhookResponse {
  success: boolean
  message: string
  result?: {
    statusCode: number
    duration: number
  }
}
