/**
 * Webhook Delivery Core Functions
 * Core delivery logic for webhooks including signature generation
 */

import type { IdempotencyResponse } from '@/lib/idempotency'
import type { Webhook, WebhookDeliveryOptions } from '../types'
import { DEFAULT_DELIVERY_OPTIONS } from './constants'
import { updateEventLogAfterDelivery, resetWebhookFailures, incrementWebhookFailures } from './webhook-operations'

/**
 * Generate HMAC-SHA256 signature for webhook payload
 *
 * @param secret - Shared secret for signature
 * @param payload - Event payload to sign
 * @returns Hex-encoded HMAC signature
 */
export function generateSignature(secret: string, payload: Record<string, unknown>): string {
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
 * Perform the actual webhook delivery (called within idempotency wrapper)
 *
 * @param webhook - Webhook configuration
 * @param payload - Event payload to deliver
 * @param options - Delivery options
 * @returns Delivery result
 */
export async function performWebhookDelivery(
  webhook: Webhook,
  payload: Record<string, unknown>,
  options: Required<WebhookDeliveryOptions>
): Promise<IdempotencyResponse & { success: boolean; statusCode?: number; delivered?: boolean; error?: string; duration?: number }> {
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

      const result = {
        status: 200,
        headers: {},
        body: {
          success: true,
          statusCode: response.status,
          delivered: true,
          duration,
        },
        success: true,
        statusCode: response.status,
        delivered: true,
        duration,
      }
      return result
    } else {
      // Failed delivery - increment consecutive failures
      await incrementWebhookFailures(webhook.id, options.maxRetries)

      const result = {
        status: response.status,
        headers: {},
        body: {
          success: false,
          statusCode: response.status,
          error: `Webhook delivery failed with status ${response.status}`,
          delivered: false,
        },
        success: false,
        statusCode: response.status,
        error: `Webhook delivery failed with status ${response.status}`,
        delivered: false,
      }
      return result
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
      success: false,
      error: errorMessage,
      delivered: false,
      duration,
    }
  }
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
) {
  const opts = { ...DEFAULT_DELIVERY_OPTIONS, ...options }

  // Idempotency key format: webhook:{event_id}
  const idempotencyKey = `webhook:${event_id}`

  // Wrap the webhook delivery in idempotency middleware
  const idempotencyResponse = await (
    await import('@/lib/idempotency')
  ).withIdempotency(
    idempotencyKey,
    async () => {
      return await performWebhookDelivery(webhook, payload, opts)
    },
    { ttl: 86400 } // 24 hours
  )

  // Extract the body from the idempotency response
  return idempotencyResponse.body
}
