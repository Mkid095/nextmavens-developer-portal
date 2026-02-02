/**
 * Webhook Operations
 * Database operations for managing webhook state and event logs
 */

import { getPool } from '@/lib/db'

/**
 * Update event log after delivery attempt
 *
 * @param webhook_id - Webhook ID
 * @param statusCode - HTTP response code
 * @param responseBody - Response body
 * @param success - Whether delivery was successful
 */
export async function updateEventLogAfterDelivery(
  webhook_id: string,
  statusCode: number,
  responseBody: string,
  success: boolean
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      UPDATE control_plane.event_log
      SET
        status = $1,
        response_code = $2,
        response_body = $3,
        delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE NULL END
      WHERE webhook_id = $4
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [success ? 'delivered' : 'failed', statusCode, responseBody, webhook_id]
    )
  } catch (error) {
    console.error('[Webhook] Error updating event log:', error)
    // Don't throw - logging failure shouldn't break webhook delivery
  }
}

/**
 * Reset consecutive failures counter after successful delivery
 *
 * @param webhook_id - Webhook ID
 */
export async function resetWebhookFailures(webhook_id: string): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      UPDATE control_plane.webhooks
      SET consecutive_failures = 0, updated_at = NOW()
      WHERE id = $1
      `,
      [webhook_id]
    )
  } catch (error) {
    console.error('[Webhook] Error resetting failures:', error)
  }
}

/**
 * Increment consecutive failures counter and auto-disable if needed
 *
 * US-011: Disable Failed Webhooks
 * After 5 consecutive failures, webhook is disabled and notification is sent
 *
 * @param webhook_id - Webhook ID
 * @param maxRetries - Maximum retry attempts before auto-disable
 */
export async function incrementWebhookFailures(
  webhook_id: string,
  maxRetries: number
): Promise<void> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      UPDATE control_plane.webhooks
      SET
        consecutive_failures = consecutive_failures + 1,
        enabled = CASE WHEN consecutive_failures + 1 >= $2 THEN false ELSE enabled END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, project_id, event, target_url, consecutive_failures, enabled
      `,
      [webhook_id, maxRetries]
    )

    const webhook = result.rows[0]

    // Auto-disable notification
    if (webhook && !webhook.enabled) {
      console.warn(
        `[Webhook] Webhook ${webhook_id} auto-disabled after ${webhook.consecutive_failures} consecutive failures`
      )

      // Send notification to project owner (US-011)
      try {
        const { sendWebhookDisabledNotification } = await import('@/features/abuse-controls/lib/notifications')
        await sendWebhookDisabledNotification(
          webhook.project_id,
          webhook.id,
          webhook.event,
          webhook.target_url,
          webhook.consecutive_failures
        )
        console.log(`[Webhook] Webhook disabled notification sent for webhook ${webhook_id}`)
      } catch (notifError) {
        console.error(`[Webhook] Failed to send webhook disabled notification:`, notifError)
        // Don't throw - notification failure shouldn't break webhook processing
      }
    }
  } catch (error) {
    console.error('[Webhook] Error incrementing failures:', error)
  }
}

/**
 * Create an event log entry for tracking
 *
 * This creates a pending event log entry that will be updated
 * after webhook delivery completes.
 *
 * @param project_id - Project ID
 * @param webhook_id - Webhook ID
 * @param event_type - Event type
 * @param payload - Event payload
 * @returns Created event log ID (used as event_id for idempotency)
 */
export async function createEventLog(
  project_id: string,
  webhook_id: string,
  event_type: string,
  payload: Record<string, unknown>
): Promise<string> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO control_plane.event_log
        (project_id, webhook_id, event_type, payload, status, retry_count)
      VALUES ($1, $2, $3, $4, 'pending', 0)
      RETURNING id
      `,
      [project_id, webhook_id, event_type, JSON.stringify(payload)]
    )

    return result.rows[0].id
  } catch (error) {
    console.error('[Webhook] Error creating event log:', error)
    throw error
  }
}

/**
 * Find webhooks for a given event type
 *
 * @param project_id - Project ID
 * @param event_type - Event type
 * @returns Array of enabled webhooks for this event
 */
export async function findWebhooksForEvent(
  project_id: string,
  event_type: string
): Promise<any[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT id, project_id, event, target_url, secret, enabled, consecutive_failures, created_at, updated_at
      FROM control_plane.webhooks
      WHERE project_id = $1
        AND event = $2
        AND enabled = true
      ORDER BY created_at ASC
      `,
      [project_id, event_type]
    )

    return result.rows
  } catch (error) {
    console.error('[Webhook] Error finding webhooks:', error)
    return []
  }
}
