/**
 * Webhook Processor Constants
 */

import type { WebhookDeliveryOptions } from '../webhook-delivery'

/**
 * Default delivery options for the background job
 */
export const JOB_DELIVERY_OPTIONS: Required<WebhookDeliveryOptions> = {
  maxRetries: 5,
  timeout: 30000, // 30 seconds
}

/**
 * Maximum retry count
 */
export const MAX_RETRY_COUNT = 5

/**
 * Maximum backoff delay in milliseconds (60 seconds)
 */
export const MAX_BACKOFF_DELAY = 60000

/**
 * Base delay for exponential backoff in milliseconds (1 second)
 */
export const BASE_BACKOFF_DELAY = 1000

/**
 * Jitter percentage for backoff (25%)
 */
export const JITTER_PERCENTAGE = 0.25
