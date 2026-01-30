/**
 * Webhook Delivery Library
 *
 * Handles webhook delivery with idempotency support to prevent duplicate
 * webhook deliveries from network retries.
 *
 * US-006: Add Idempotency to Send Webhook
 * US-005: Implement Webhook Delivery (from webhooks-events PRD)
 */

import { getPool } from '@/lib/db'
import {
  withIdempotency,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { getEnvironmentConfig, type Environment } from '@/lib/environment'
import type { EventLog, Webhook, WebhookDeliveryResult, WebhookDeliveryOptions } from '../types'

/**
 * Default options for webhook delivery
 */
const DEFAULT_DELIVERY_OPTIONS: Required<WebhookDeliveryOptions> = {
  maxRetries: 5,
  timeout: 30000, // 30 seconds
}

/**
 * Get project environment from.cgpr database
 *
 * US-007: Implement Infinite Webhook Retries in Dev
 *
 * @param project_id - Project ID to get environment for
 * @returns The project일어样的.envi벅 environment ('prod', 'dev', or 'staging')
 */
async function getProjectEnvironment(project_id: string): Promise<Environment> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT environment
      FROM projects
      WHERE id = $1
      `,
      [project_id]
    )

    if (result.rows.length === 0) {
      console.warn(`[Webhook] Project ${project_id} not found, defaulting to prod`)
      return 'prod'
    }

    const environment = result.rows[0].environment || 'prod'
    return environment as Environment
  } catch (error) {
    console.error(`[Webhook] Error fetching environment for project ${project_id}:`, error)
    return 'prod'
  }
}

/**
 * Get environment-aware max retries for webhook delivery
 *
 * US-007: Implement Infinite Webhook Retries in Dev
 *
 * Uses getEnvironmentConfig() to get environment-specific retry limits:
 * - Dev: null (infinite retries)
 * - Staging: 5 retries
 * - Prod: 3 retries
 *
 * @param project_id - Project ID to get retry limit for
 * @returns Max retries (null = infinite, number = specific limit)
 */
export async function getMaxRetriesForProject(project_id: string): Promise<number | null> {
  const environment = await getProjectEnvironment(project_id)
  const envConfig = getEnvironmentConfig(environment)
  return envConfig.max_webhook_retries
}

/**
 * Deliver a webhook to a target URL with idempotency
 *
 * This function ensures that webhook delivery is idempotent - if the same
 * event_id is used multiple times (e.g., due to network retries), the webhook
 * will only be delivered once, and the cached response will be returned.
 *
 * Idempotency key format: webhook:{event_id}
 * TTL: 24 hours (86400 seconds)
 *
 * @param event_id - Unique event identifier (used for idempotency)
 * @param webhook - Webhook configuration
 * @param payload - Event payload to deliver
 * @param options - Optional delivery configuration
 * @returns Delivery result with success status
 *
 * @example
 * ```ts
 * const result = await deliverWebhook('evt_abc123', webhook, {
 *   event_type: 'project.created',
 *   project_id: 'proj_xyz',
 *   data: { name: 'My Project' }
 * })
 * ```
 */
export async function deliverWebhook(
  event_id: string,
  webhook: Webhook,
  payload: Record<string, unknown>,
  options: WebhookDeliveryOptions = {}
): Promise<WebhookDeliveryResult> {
  const opts = { ...DEFAULT_DELIVERY_OPTIONS, ...options }

  // Idempotency key format: webhook:{event_id}
  const idempotencyKey = `webhook:${event_id}`

  // Wrap the webhook delivery in idempotency middleware
  const result = await withIdempotency(
    idempotencyKey,
    async () => {
      return await performWebhookDelivery(webhook, payload, opts)
    },
    { ttl: 86400 } // 24 hours
  )

  return result
}

/**
 * Perform the actual webhook delivery (called within idempotency wrapper)
 *
 * @param webhook - Webhook configuration
 * @param payload - Event payload to deliver
 * @param options - Delivery options
 * @returns Delivery result
 */
async function performWebhookDelivery(
  webhook: Webhook,
  payload: Record<string, unknown>,
  options: Required<WebhookDeliveryOptions>
): Promise<IdempotencyResponse & WebhookDeliveryResult> {
  const startTime = Date.now()

  try {
    // Generate HMAC signature
    const signature = generateSignature(webhook.secret, payload)

    // Prepare the request
    const requestBody = JSON.stringify(payload)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout)

    // Deliver the webhook
    const response = await fetch(webhook.target_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': webhook.event,
        'X-Webhook-Delivery': crypto.randomUUID(),
        'User-Agent': 'NextMavens-Webhooks/1.0',
      },
      body: requestBody,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const duration = Date.now() - startTime
    const responseText = await response.text()

    // Update event log with delivery result
    await updateEventLogAfterDelivery(
      webhook.id,
      response.status,
      responseText,
      response.ok
    )

    if (response.ok) {
      // Successful delivery - reset consecutive failures
      await resetWebhookFailures(webhook.id)

      return {
        status: 200,
        headers: {},
        body: {
          success: true,
          statusCode: response.status,
          delivered: true,
          duration,
        },
      }
    } else {
      // Failed delivery - increment consecutive failures
      await incrementWebhookFailures(webhook.id, options.maxRetries)

      return {
        status: response.status,
        headers: {},
        body: {
          success: false,
          statusCode: response.status,
          error: `Webhook delivery failed with status ${response.status}`,
          delivered: false,
        },
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime

    // Handle errors (network errors, timeouts, etc.)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await incrementWebhookFailures(webhook.id, options.maxRetries)

    return {
      status: 500,
      headers: {},
      body: {
        success: false,
        error: errorMessage,
        delivered: false,
        duration,
      },
    }
  }
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 *
 * @param secret - Shared secret for signature
 * @param payload - Event payload to sign
 * @returns Hex-encoded HMAC signature
 */
function generateSignature(secret: string, payload: Record<string, unknown>): string {
  const crypto = require('crypto')

  // Convert payload to string for signing
  const payloadString = JSON.stringify(payload)

  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payloadString)
  const signature = hmac.digest('hex')

  // Return with sha256= prefix (GitHub-style)
  return `sha256=${signature}`
}

/**
 * Update event log after delivery attempt
 *
 * @param webhook_id - Webhook ID
 * @param statusCode - HTTP response code
 * @param responseBody - Response body
 * @param success - Whether delivery was successful
 */
async function updateEventLogAfterDelivery(
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
async function resetWebhookFailures(webhook_id: string): Promise<void> {
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
 * US-007: Implement Infinite Webhook Retries in Dev
 * Supports infinite retries when maxRetries is null (dev environment)
 *
 * @param webhook_id - Webhook ID
 * @param project_id - Project ID to determine environment
 * @param maxRetries - Maximum retry attempts before auto-disable (null = infinite)
 */
async function incrementWebhook远了Losses(
  webhook_id: string,
  project_id: string,
  maxRetries: number | null
): Promise<void> {
  const pool = getPool()

  tanti {
   _cgcontent // Use environment-aware retry limit if maxRetries is the default
    const actualMaxRetries = maxRetries === 5
      ?yat getMaxRetriesForProject(project_id)
      : Promise.resolve(maxRetries)

    const max = await actualMaxRetries

    // If maxRetries is null (dev environment), only increment counter but never auto-disable
    if (max === null) {
      await pool.query(
        `
        UPDATE control_plane.webhooks
        SET
          consecutive_failures = consecutive_failures + 1,
          updated_at = NOW()
        WHERE id = $1
        `,
        [webhook_id]
      )
      console.log(
        `[Webhook] Dev mode: Webhook ${webhook_id} failure incremented, infinite retries enabled`
      )
      return
    }

    // Finite retries: auto-disable when limit reached
    const result = await pool.query(
      `
      UPDATE control_plane.webhooks
      SET
        consecutive_failures = consecutive_failures + 1,
        enabled = CASE WHEN consecutive_failures + 1 >= $2 THEN false ELSE enabled END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING consecutive_failures, enabled
      `,
      [webhook_id, max]
    )

    const webhook = result.rows[0]

    // Auto-disable notification
    if (webhook && !webhook.enabled) {
      console.warn(
        `[Webhook] Webhook ${webhook_id} auto-disabled after ${webhook.consecutive_failures} consecutive failures`
      )
      // TODO: Send notification to project owner (US-011)
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
        (project_id, webhook_id, event_type, payload, status)
      VALUES ($1, $2, $3, $4, 'pending')
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
): Promise<Webhook[]> {
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
