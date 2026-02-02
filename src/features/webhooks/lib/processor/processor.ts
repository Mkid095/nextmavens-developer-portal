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
import type { WebhookProcessorResult, EventLogEntry } from './types'
import { shouldRetryNow, formatDuration } from './utils'
import { processWebhookDelivery } from './delivery'

const LOG_SEPARATOR = '='.repeat(60)

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
  console.log(LOG_SEPARATOR)
  console.log(`[Webhook Processor] Job started at ${startTime.toISOString()}`)
  console.log(LOG_SEPARATOR)

  try {
    const pool = getPool()

    // Fetch pending event_log entries that are ready for retry
    const pendingResult = await pool.query<EventLogEntry>(
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
        `[Webhook Processor] Processing event ${event.id} (${event.event_type}), retry ${event.retry_count! + 1}/5`
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
        retryCount: event.retry_count! + 1,
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
    console.log(LOG_SEPARATOR)
    console.log(`[Webhook Processor] Job completed`)
    console.log(`[Webhook Processor] Duration: ${formatDuration(durationMs)}`)
    console.log(`[Webhook Processor] Events processed: ${result.eventsProcessed}`)
    console.log(`[Webhook Processor] Deliveries succeeded: ${result.deliveriesSucceeded}`)
    console.log(`[Webhook Processor] Deliveries failed: ${result.deliveriesFailed}`)
    console.log(`[Webhook Processor] Webhooks disabled: ${result.webhooksDisabled}`)
    console.log(LOG_SEPARATOR)

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(LOG_SEPARATOR)
    console.error(`[Webhook Processor] Job failed`)
    console.error(`[Webhook Processor] Duration: ${formatDuration(durationMs)}`)
    console.error(`[Webhook Processor] Error: ${errorMessage}`)
    console.error(LOG_SEPARATOR)

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
