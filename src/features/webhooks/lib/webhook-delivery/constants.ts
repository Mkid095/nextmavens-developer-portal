/**
 * Webhook Delivery Constants
 * Default options and configuration values for webhook delivery
 */

import type { WebhookDeliveryOptions } from '../types'

/**
 * Default options for webhook delivery
 */
export const DEFAULT_DELIVERY_OPTIONS: Required<WebhookDeliveryOptions> = {
  maxRetries: 5,
  timeout: 30000, // 30 seconds
}
