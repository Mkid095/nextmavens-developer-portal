/**
 * Event Emission Functions
 * Functions for emitting events and delivering to webhooks
 */

import { getPool } from '@/lib/db'
import type { Webhook, WebhookDeliveryResult } from '../types'
import { deliverWebhook } from './delivery'
import { createEventLog, findWebhooksForEvent } from './webhook-operations'

/**
 * Emit an event and deliver to all registered webhooks
 *
 * This is the main entry point for emitting events. It creates event log
 * entries and delivers webhooks with idempotency support.
 *
 * @param project_id - Project ID
 * @param event_type - Event type
 * @param payload - Event payload
 * @returns Array of delivery results
 */
export async function emitEvent(
  project_id: string,
  event_type: string,
  payload: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  // Find all webhooks for this event
  const webhooks = await findWebhooksForEvent(project_id, event_type)

  if (webhooks.length === 0) {
    console.log(`[Webhook] No webhooks registered for ${event_type}`)
    return []
  }

  console.log(`[Webhook] Delivering to ${webhooks.length} webhook(s) for ${event_type}`)

  // Deliver to each webhook
  const results: WebhookDeliveryResult[] = []

  for (const webhook of webhooks) {
    try {
      // Create event log entry (generates event_id for idempotency)
      const event_id = await createEventLog(
        project_id,
        webhook.id,
        event_type,
        payload
      )

      // Deliver webhook with idempotency
      const result = await deliverWebhook(event_id, webhook, payload)

      results.push(result)
    } catch (error) {
      console.error(`[Webhook] Error delivering to webhook ${webhook.id}:`, error)
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Create a platform-level event log entry (without webhooks)
 *
 * US-007: Emit Events on Actions
 * This function creates an event log entry for platform-level events
 * that don't have an associated project (e.g., user.signedup).
 * These events are logged but not delivered to webhooks since webhooks
 * are scoped to projects.
 *
 * @param event_type - Event type
 * @param payload - Event payload
 * @returns Created event log ID or null
 */
export async function emitPlatformEvent(
  event_type: string,
  payload: Record<string, unknown>
): Promise<string | null> {
  const pool = getPool()

  try {
    // Create event log entry without a webhook (webhook_id is NULL)
    // Use a special system project_id for platform events
    const result = await pool.query(
      `
      INSERT INTO control_plane.event_log
        (project_id, webhook_id, event_type, payload, status, retry_count)
      VALUES ($1, NULL, $2, $3, 'delivered', 0)
      RETURNING id
      `,
      ['00000000-0000-0000-0000-000000000000', event_type, JSON.stringify(payload)]
    )

    console.log(`[Webhook] Platform event logged: ${event_type}`)
    return result.rows[0].id
  } catch (error) {
    console.error('[Webhook] Error creating platform event log:', error)
    return null
  }
}
