/**
 * Webhook Processor Background Job
 *
 * Processes pending webhook delivery events from the event_log table.
 * This job runs on a schedule (e.g., every minute) and delivers webhooks
 * with retry logic and exponential backoff.
 *
 * US-005: Implement Webhook Delivery
 * US-011: Disable Failed Webhooks
 *
 * Usage:
 * - Call runWebhookProcessor() from a cron job (e.g., every minute)
 * - The function will process pending event_log entries
 * - Implements exponential backoff retry (up to 5 attempts)
 * - Auto-disables webhooks after 5 consecutive failures
 */

import { getPool } from '@/lib/db'
import { performWebhookDelivery, type Webhook, type WebhookDeliveryOptions } from './webhook-delivery'

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

/**
 * Default delivery options for the background job
 */
const JOB_DELIVERY_OPTIONS: Required<WebhookDeliveryOptions> = {
  maxRetries: 5,
  timeout: 30000, // 30 seconds
}

/**
 * Calculate exponential backoff delay for retry
 *
 * Uses exponential backoff with jitter: base_delay * (2^retry_count) + random_jitter
 *
 * @param retryCount - Current retry attempt (0-indexed)
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(retryCount: number): number {
  // Base delay: 1 second, doubling each retry
  const baseDelay = 1000 * Math.pow(2, retryCount)

  // Add jitter: ±25% random variation to avoid thundering herd
  const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1)

  // Cap at 60 seconds maximum delay
  return Math.min(baseDelay + jitter, 60000)
}

/**
 * Check if an event log entry should be retried based on retry count and timing
 *
 * @param eventLog - Event log entry
 * @returns Whether the event should be retried now
 */
function shouldRetryNow(eventLog: {
  retry_count: number
  created_at: Date
}): boolean {
  // Max 5 retries
  if (eventLog.retry_count >= 5) {
    return false
  }

  // Calculate when next retry should happen (exponential backoff)
  const backoffDelay = calculateBackoffDelay(eventLog.retry_count)
  const nextRetryAt = new Date(eventLog.created_at.getTime() + backoffDelay)

  // Check if enough time has passed
  return new Date() >= nextRetryAt
}

/**
 * Process a single pending webhook delivery
 *
 * @param eventLog - Event log entry to process
 * @returns Processing result
 */
async function processWebhookDelivery(eventLog: {
  id: string
  project_id: string
  webhook_id: string
  event_type: string
  payload: unknown
}): Promise<{
  status: 'delivered' | 'failed'
  statusCode?: number
  error?: string
  webhookDisabled: boolean
}> {
  const pool = getPool()

  try {
    // Fetch webhook configuration
    const webhookResult = await pool.query<Webhook>(
      `
      SELECT id, project_id, event, target_url, secret, enabled, consecutive_failures, created_at, updated_at
      FROM control_plane.webhooks
      WHERE id = $1
      `,
      [eventLog.webhook_id]
    )

    if (webhookResult.rows.length === 0) {
      // Webhook not found - mark as failed
      return {
        status: 'failed',
        error: 'Webhook configuration not found',
        webhookDisabled: false,
      }
    }

    const webhook = webhookResult.rows[0]

    // Check if webhook is disabled
    if (!webhook.enabled) {
      return {
        status: 'failed',
        error: 'Webhook is disabled',
        webhookDisabled: false,
      }
    }

    // Perform webhook delivery
    const result = await performWebhookDelivery(
      webhook,
      eventLog.payload as Record<string, unknown>,
      JOB_DELIVERY_OPTIONS
    )

    // Check if webhook was auto-disabled
    const webhookDisabledResult = await pool.query(
      `
      SELECT enabled, consecutive_failures
      FROM control_plane.webhooks
      WHERE id = $1
      `,
      [webhook.id]
    )

    const wasDisabled = !webhookDisabledResult.rows[0]?.enabled

    if (result.body.success) {
      return {
        status: 'delivered',
        statusCode: result.body.statusCode,
        webhookDisabled: wasDisabled,
      }
    } else {
      return {
        status: 'failed',
        statusCode: result.status,
        error: result.body.error || 'Unknown error',
        webhookDisabled: wasDisabled,
      }
    }
  } catch (error) {
    console.error(`[Webhook Processor] Error processing event ${eventLog.id}:`, error)
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      webhookDisabled: false,
    }
  }
}

/**
 * Run the webhook processor background job
 *
 * This function processes pending event_log entries and delivers webhooks
 * with exponential backoff retry logic. Failed webhooks are automatically
 * disabled after 5 consecutive failures.
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler (every minute)
 * const result = await runWebhookProcessor();
 * console.log(`Job completed: ${result.deliveriesSucceeded} delivered, ${result.deliveriesFailed} failed`);
 */
export async function runWebhookProcessor(): Promise<WebhookProcessorResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Webhook Processor] Job started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  try {
    const pool = getPool()

    // Fetch pending event_log entries that are ready for retry
    const pendingResult = await pool.query(
      `
      SELECT
        id,
        project_id,
        webhook_id,
        event_type,
        payload,
        retry_count,
        created_at
      FROM control_plane.event_log
      WHERE status = 'pending'
        AND webhook_id IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 100
      `
    )

    const pendingEvents = pendingResult.rows

    if (pendingEvents.length === 0) {
      console.log('[Webhook Processor] No pending events to process')
      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()

      return {
        success: true,
        startedAt: startTime,
        completedAt: endTime,
        durationMs,
        eventsProcessed: 0,
        deliveriesSucceeded: 0,
        deliveriesFailed: 0,
        webhooksDisabled: 0,
        processedEvents: [],
      }
    }

    console.log(`[Webhook Processor] Found ${pendingEvents.length} pending event(s)`)

    // Filter events that should be retried now
    const eventsToProcess = pendingEvents.filter(shouldRetryNow)
    console.log(`[Webhook Processor] Processing ${eventsToProcess.length} event(s) ready for retry`)

    // Process each event
    const processedEvents: WebhookProcessorResult['processedEvents'] = []
    let deliveriesSucceeded = 0
    let deliveriesFailed = 0
    let webhooksDisabled = 0

    for (const event of eventsToProcess) {
      console.log(
        `[Webhook Processor] Processing event ${event.id} (${event.event_type}), retry ${event.retry_count + 1}/5`
      )

      // Increment retry count before processing
      await pool.query(
        `
        UPDATE control_plane.event_log
        SET retry_count = retry_count + 1
        WHERE id = $1
        `,
        [event.id]
      )

      // Process the webhook delivery
      const result = await processWebhookDelivery(event)

      // Update event log status
      const newStatus = result.status
      await pool.query(
        `
        UPDATE control_plane.event_log
        SET
          status = $1,
          response_code = $2,
          response_body = $3,
          delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE NULL END
        WHERE id = $4
        `,
        [newStatus, result.statusCode || null, result.error || null, event.id]
      )

      // Track results
      processedEvents.push({
        eventLogId: event.id,
        webhookId: event.webhook_id,
        eventType: event.event_type,
        status: result.status,
        retryCount: event.retry_count + 1,
      })

      if (result.status === 'delivered') {
        deliveriesSucceeded++
        console.log(`[Webhook Processor] ✓ Event ${event.id} delivered successfully`)
      } else {
        deliveriesFailed++
        console.log(`[Webhook Processor] ✗ Event ${event.id} failed: ${result.error}`)
      }

      if (result.webhookDisabled) {
        webhooksDisabled++
        console.log(`[Webhook Processor] ⚠ Webhook ${event.webhook_id} auto-disabled after 5 consecutive failures`)
      }
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const result: WebhookProcessorResult = {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      eventsProcessed: eventsToProcess.length,
      deliveriesSucceeded,
      deliveriesFailed,
      webhooksDisabled,
      processedEvents,
    }

    // Log summary
    console.log('='.repeat(60))
    console.log(`[Webhook Processor] Job completed`)
    console.log(`[Webhook Processor] Duration: ${durationMs}ms`)
    console.log(`[Webhook Processor] Events processed: ${result.eventsProcessed}`)
    console.log(`[Webhook Processor] Deliveries succeeded: ${result.deliveriesSucceeded}`)
    console.log(`[Webhook Processor] Deliveries failed: ${result.deliveriesFailed}`)
    console.log(`[Webhook Processor] Webhooks disabled: ${result.webhooksDisabled}`)
    console.log('='.repeat(60))

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Webhook Processor] Job failed`)
    console.error(`[Webhook Processor] Duration: ${durationMs}ms`)
    console.error(`[Webhook Processor] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      eventsProcessed: 0,
      deliveriesSucceeded: 0,
      deliveriesFailed: 0,
      webhooksDisabled: 0,
      processedEvents: [],
      error: errorMessage,
    }
  }
}

/**
 * Get webhook delivery statistics
 *
 * @param hours - Number of hours to look back (default: 24)
 * @returns Summary of webhook delivery statistics
 */
export async function getWebhookDeliveryStats(hours: number = 24): Promise<{
  totalEvents: number
  delivered: number
  failed: number
  pending: number
  disabledWebhooks: number
}> {
  const pool = getPool()

  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Get event counts by status
    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM control_plane.event_log
      WHERE created_at >= $1
      `,
      [since]
    )

    // Get disabled webhooks count
    const disabledResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM control_plane.webhooks
      WHERE enabled = false
      `
    )

    return {
      totalEvents: parseInt(statsResult.rows[0].total, 10),
      delivered: parseInt(statsResult.rows[0].delivered, 10),
      failed: parseInt(statsResult.rows[0].failed, 10),
      pending: parseInt(statsResult.rows[0].pending, 10),
      disabledWebhooks: parseInt(disabledResult.rows[0].count, 10),
    }
  } catch (error) {
    console.error('[Webhook Processor] Error getting stats:', error)
    return {
      totalEvents: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      disabledWebhooks: 0,
    }
  }
}
