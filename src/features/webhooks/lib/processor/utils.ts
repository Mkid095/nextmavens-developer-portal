/**
 * Webhook Processor Utilities
 */

import {
  MAX_RETRY_COUNT,
  MAX_BACKOFF_DELAY,
  BASE_BACKOFF_DELAY,
  JITTER_PERCENTAGE,
} from './constants'

/**
 * Calculate exponential backoff delay for retry
 *
 * Uses exponential backoff with jitter: base_delay * (2^retry_count) + random_jitter
 *
 * @param retryCount - Current retry attempt (0-indexed)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(retryCount: number): number {
  // Base delay: 1 second, doubling each retry
  const baseDelay = BASE_BACKOFF_DELAY * Math.pow(2, retryCount)

  // Add jitter: ±25% random variation to avoid thundering herd
  const jitter = baseDelay * JITTER_PERCENTAGE * (Math.random() * 2 - 1)

  // Cap at 60 seconds maximum delay
  return Math.min(baseDelay + jitter, MAX_BACKOFF_DELAY)
}

/**
 * Check if an event log entry should be retried based on retry count and timing
 *
 * @param eventLog - Event log entry
 * @returns Whether the event should be retried now
 */
export function shouldRetryNow(eventLog: {
  retry_count: number
  created_at: Date
}): boolean {
  // Max 5 retries
  if (eventLog.retry_count >= MAX_RETRY_COUNT) {
    return false
  }

  // Calculate when next retry should happen (exponential backoff)
  const backoffDelay = calculateBackoffDelay(eventLog.retry_count)
  const nextRetryAt = new Date(eventLog.created_at.getTime() + backoffDelay)

  // Check if enough time has passed
  return new Date() >= nextRetryAt
}

/**
 * Format job duration for logging
 *
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`
  }
  return `${(durationMs / 1000).toFixed(2)}s`
}
