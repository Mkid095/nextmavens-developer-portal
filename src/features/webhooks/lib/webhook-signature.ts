/**
 * Webhook Signature Verification Library
 *
 * Provides utilities for verifying webhook signatures.
 * Webhook consumers can use these functions to verify that incoming
 * webhooks are authentic and haven't been tampered with.
 *
 * US-006: Implement Signature Verification
 */

import { createHmac } from 'crypto'

/**
 * Verify a webhook signature
 *
 * This function verifies that the webhook payload matches the signature
 * provided in the X-Webhook-Signature header. This ensures that the webhook
 * is authentic and hasn't been tampered with in transit.
 *
 * @param payload - The raw request body as a string (important: use raw body, not parsed JSON)
 * @param signature - The signature from the X-Webhook-Signature header
 * @param secret - Your webhook secret (shown when creating the webhook)
 * @returns true if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@/features/webhooks/lib/webhook-signature'
 *
 * // In your webhook handler:
 * export async function POST(request: Request) {
 *   const body = await request.text() // Get raw body
 *   const signature = request.headers.get('X-Webhook-Signature')
 *   const secret = process.env.WEBHOOK_SECRET
 *
 *   const isValid = verifyWebhookSignature(body, signature, secret)
 *
 *   if (!isValid) {
 *     return new Response('Invalid signature', { status: 401 })
 *   }
 *
 *   // Process webhook...
 *   const data = JSON.parse(body)
 *   return new Response('OK', { status: 200 })
 * }
 * ```
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  // If no signature provided, reject
  if (!signature) {
    console.warn('[Webhook] No signature provided in X-Webhook-Signature header')
    return false
  }

  try {
    // Generate expected signature
    const expectedSignature = generateSignature(payload, secret)

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(expectedSignature, signature)
  } catch (error) {
    console.error('[Webhook] Error verifying signature:', error)
    return false
  }
}

/**
 * Generate an HMAC-SHA256 signature
 *
 * This function generates the same signature that the platform uses
 * to sign webhook payloads. It's provided for reference and testing.
 *
 * @param payload - The payload to sign (as string)
 * @param secret - Your webhook secret
 * @returns The signature in format "sha256=<hex>"
 *
 * @example
 * ```typescript
 * import { generateSignature } from '@/features/webhooks/lib/webhook-signature'
 *
 * const payload = JSON.stringify({ event: 'project.created', data: {} })
 * const secret = 'your_webhook_secret'
 * const signature = generateSignature(payload, secret)
 * console.log(signature) // "sha256=abc123..."
 * ```
 */
export function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const digest = hmac.digest('hex')
  return `sha256=${digest}`
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * When comparing signatures, it's important to use a constant-time
 * comparison function. Regular string comparison (===) can leak
 * information through timing differences.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  // If lengths don't match, they're definitely not equal
  if (a.length !== b.length) {
    return false
  }

  // Constant-time comparison using crypto.subtle (if available)
  // or manual comparison
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Browser/Edge runtime with Web Crypto API
    const encoder = new TextEncoder()
    const aBuffer = encoder.encode(a)
    const bBuffer = encoder.encode(b)

    // In a real implementation, we'd use crypto.subtle.timingSafeEqual
    // but for broader compatibility, we'll use manual comparison
    let result = 0
    for (let i = 0; i < aBuffer.length; i++) {
      result |= aBuffer[i] ^ bBuffer[i]
    }
    return result === 0
  }

  // Node.js runtime - manual constant-time comparison
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Extract signature from X-Webhook-Signature header
 *
 * The signature header may contain multiple signatures with different
 * algorithms. This function extracts the sha256 signature.
 *
 * @param signatureHeader - The raw signature header value
 * @returns The extracted signature or null if not found
 *
 * @example
 * ```typescript
 * const header = request.headers.get('X-Webhook-Signature')
 * const signature = extractSignature(header)
 * // signature will be the "abc123..." part of "sha256=abc123..."
 * ```
 */
export function extractSignature(signatureHeader: string | null): string | null {
  if (!signatureHeader) {
    return null
  }

  // The signature is in format "sha256=<hex>"
  // Extract the hex part
  const match = signatureHeader.match(/^sha256=([a-f0-9]+)$/i)
  return match ? match[1] : null
}

/**
 * Parse webhook request with verification
 *
 * This is a convenience function that combines parsing and verification
 * for a typical webhook handler.
 *
 * @param request - The incoming HTTP request
 * @param secret - Your webhook secret
 * @returns Parsed and verified webhook data, or throws if invalid
 * @throws {Error} If signature is invalid or payload is malformed
 *
 * @example
 * ```typescript
 * import { parseVerifiedWebhook } from '@/features/webhooks/lib/webhook-signature'
 *
 * export async function POST(request: Request) {
 *   try {
 *     const webhook = await parseVerifiedWebhook(request, process.env.WEBHOOK_SECRET!)
 *
 *     console.log('Received webhook:', webhook.event, webhook.data)
 *
 *     // Process webhook...
 *     return new Response('OK', { status: 200 })
 *   } catch (error) {
 *     console.error('Webhook error:', error)
 *     return new Response('Webhook processing failed', { status: 400 })
 *   }
 * }
 * ```
 */
export async function parseVerifiedWebhook<T = Record<string, unknown>>(
  request: Request,
  secret: string
): Promise<VerifiedWebhook<T>> {
  // Get raw body
  const body = await request.text()

  // Get signature
  const signature = request.headers.get('X-Webhook-Signature')

  // Verify signature
  const isValid = verifyWebhookSignature(body, signature, secret)

  if (!isValid) {
    throw new Error('Invalid webhook signature')
  }

  // Parse JSON
  let data: T
  try {
    data = JSON.parse(body) as T
  } catch (error) {
    throw new Error('Invalid webhook payload JSON')
  }

  // Get event type from header
  const eventType = request.headers.get('X-Webhook-Event') || ''

  // Get delivery ID
  const deliveryId = request.headers.get('X-Webhook-Delivery') || ''

  return {
    event: eventType,
    data,
    deliveryId,
  }
}

/**
 * Verified webhook data structure
 */
export interface VerifiedWebhook<T = Record<string, unknown>> {
  /**
   * The event type (e.g., "project.created", "user.signedup")
   */
  event: string

  /**
   * The webhook payload data
   */
  data: T

  /**
   * Unique delivery ID for tracking
   */
  deliveryId: string
}
