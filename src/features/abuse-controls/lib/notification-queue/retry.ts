/**
 * Notification Retry Logic
 *
 * Handles retry logic for failed notifications, including
 * maximum retry enforcement, backoff calculation, and
 * failure classification.
 */

import type { NotificationStatus, NotificationChannel } from '../types'

/**
 * Maximum number of retry attempts for failed notifications
 */
export const MAX_RETRY_ATTEMPTS = 3

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: MAX_RETRY_ATTEMPTS,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
}

/**
 * Retry decision result
 */
export interface RetryDecision {
  shouldRetry: boolean
  nextAttemptIn?: number // milliseconds
  reason?: string
}

/**
 * Determine if a notification should be retried
 *
 * Evaluates whether a failed notification should be retried based on:
 * - Number of previous attempts
 * - Type of error
 * - Channel-specific rules
 *
 * @param currentAttempts - Number of attempts already made
 * @param error - Error that caused the failure
 * @param channel - Notification channel being used
 * @param config - Optional retry configuration
 * @returns Retry decision with backoff timing
 */
export function shouldRetryNotification(
  currentAttempts: number,
  error: unknown,
  channel: NotificationChannel,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): RetryDecision {
  // Check if max attempts exceeded
  if (currentAttempts >= config.maxAttempts) {
    return {
      shouldRetry: false,
      reason: `Maximum retry attempts (${config.maxAttempts}) exceeded`,
    }
  }

  // Check error type - some errors should not be retried
  const errorMessage = error instanceof Error ? error.message : String(error)

  // Permanent errors that should not be retried
  const permanentErrors = [
    'invalid recipient',
    'blocked',
    'unsubscribed',
    'not implemented',
    'unknown channel',
  ]

  const isPermanentError = permanentErrors.some((permanentError) =>
    errorMessage.toLowerCase().includes(permanentError)
  )

  if (isPermanentError) {
    return {
      shouldRetry: false,
      reason: `Permanent error: ${errorMessage}`,
    }
  }

  // Calculate exponential backoff delay
  const delay = Math.min(
    config.baseDelay * Math.pow(2, currentAttempts),
    config.maxDelay
  )

  return {
    shouldRetry: true,
    nextAttemptIn: delay,
  }
}

/**
 * Calculate delay before next retry attempt
 *
 * Uses exponential backoff with jitter to prevent thundering herd
 * problems when many notifications fail simultaneously.
 *
 * @param attemptNumber - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  // Exponential backoff
  const exponentialDelay = config.baseDelay * Math.pow(2, attemptNumber)

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay)

  // Add jitter (±25%) to prevent synchronized retries
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1)

  return Math.max(0, Math.round(cappedDelay + jitter))
}

/**
 * Determine final status based on retry outcome
 *
 * @param success - Whether the operation succeeded
 * @param currentAttempts - Number of attempts made
 * @param config - Retry configuration
 * @returns Final notification status
 */
export function determineFinalStatus(
  success: boolean,
  currentAttempts: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): NotificationStatus {
  if (success) {
    return 'delivered' as NotificationStatus
  }

  // If max attempts reached, mark as permanently failed
  if (currentAttempts >= config.maxAttempts) {
    return 'failed' as NotificationStatus
  }

  // Otherwise mark as failed but retryable
  return 'failed' as NotificationStatus
}

/**
 * Classify error type
 *
 * Categorizes errors to determine retry strategy.
 *
 * @param error - Error to classify
 * @returns Error classification
 */
export function classifyError(error: unknown): {
  isPermanent: boolean
  isTransient: boolean
  category: string
} {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const lowerMessage = errorMessage.toLowerCase()

  // Permanent failures - don't retry
  const permanentPatterns = [
    'invalid recipient',
    'blocked',
    'unsubscribed',
    'not found',
    'unauthorized',
    'forbidden',
    'not implemented',
    'unknown channel',
  ]

  // Transient failures - safe to retry
  const transientPatterns = [
    'timeout',
    'connection',
    'network',
    'rate limit',
    'temporary',
    'unavailable',
    'econnrefused',
    'etimedout',
  ]

  const isPermanent = permanentPatterns.some((pattern) =>
    lowerMessage.includes(pattern)
  )
  const isTransient = transientPatterns.some((pattern) =>
    lowerMessage.includes(pattern)
  )

  let category = 'unknown'
  if (isPermanent) category = 'permanent'
  else if (isTransient) category = 'transient'
  else category = 'uncategorized'

  return {
    isPermanent,
    isTransient,
    category,
  }
}

/**
 * Create error log entry
 *
 * Formats error information for logging.
 *
 * @param error - Error to log
 * @param context - Additional context
 * @returns Formatted error log message
 */
export function createErrorLogEntry(
  error: unknown,
  context: {
    notificationId?: string
    channel?: NotificationChannel
    attemptNumber?: number
  }
): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  const parts = [
    `[NotificationQueue] Error`,
    context.notificationId ? `for notification ${context.notificationId}` : '',
    context.channel ? `via ${context.channel}` : '',
    context.attemptNumber !== undefined ? `(attempt ${context.attemptNumber + 1})` : '',
    `: ${errorMessage}`,
  ]

  const logMessage = parts.filter(Boolean).join(' ')

  // Log stack trace if available
  if (errorStack) {
    console.debug(logMessage, '\n', errorStack)
  }

  return logMessage
}
