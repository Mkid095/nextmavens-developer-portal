/**
 * Webhook Delivery Library
 *
 * Handles webhook delivery with idempotency support to prevent duplicate
 * webhook deliveries from network retries.
 *
 * US-006: Add Idempotency to Send Webhook
 * US-005: Implement Webhook Delivery (from webhooks-events PRD)
 *
 * @module webhook-delivery
 */

// Re-export all types, constants, and functions for webhook delivery
export {
  // Types
  type Webhook,
  type WebhookDeliveryOptions,
  type WebhookDeliveryResult,

  // Constants
  DEFAULT_DELIVERY_OPTIONS,

  // Delivery functions
  generateSignature,
  performWebhookDelivery,
  deliverWebhook,

  // Webhook operations
  updateEventLogAfterDelivery,
  resetWebhookFailures,
  incrementWebhookFailures,
  createEventLog,
  findWebhooksForEvent,

  // Event emission
  emitEvent,
  emitPlatformEvent,
} from './webhook-delivery'
