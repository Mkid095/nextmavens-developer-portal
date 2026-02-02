/**
 * Webhook Delivery Processing
 */

import { getPool } from '@/lib/db'
import type { Webhook, WebhookDeliveryOptions, WebhookDeliveryResult } from '../webhook-delivery'
import { performWebhookDelivery } from '../webhook-delivery'
import type { EventLogEntry, DeliveryProcessResult } from './types'
import { JOB_DELIVERY_OPTIONS } from './constants'

/**
 * Process a single pending webhook delivery
 *
 * @param eventLog - Event log entry to process
 * @returns Processing result
 */
export async function processWebhookDelivery(eventLog: EventLogEntry): Promise<DeliveryProcessResult> {
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

    const body = result.body as WebhookDeliveryResult

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

    if (body.success) {
      return {
        status: 'delivered',
        statusCode: body.statusCode,
        webhookDisabled: wasDisabled,
      }
    } else {
      return {
        status: 'failed',
        statusCode: result.status,
        error: body.error || 'Unknown error',
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
