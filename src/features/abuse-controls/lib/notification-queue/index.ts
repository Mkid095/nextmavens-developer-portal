/**
 * Notification Queue System
 *
 * Manages the queue of pending notifications and processes them asynchronously.
 * Provides retry logic, failure handling, and delivery tracking.
 *
 * This module has been refactored from a single 538-line file into
 * multiple focused modules:
 * - queue-operations.ts: Database operations for queue management
 * - worker.ts: Core notification processing logic
 * - retry.ts: Retry logic and failure handling
 * - utils.ts: Utility functions
 *
 * All functionality is preserved while keeping each module under 300 lines.
 */

// Queue operations - database access
export {
  getQueuedNotifications,
  markNotificationAsProcessing,
  updateNotificationResult,
  getQueueStatistics,
  cleanupOldNotifications,
  type QueuedNotification,
  type QueueStatistics,
} from './queue-operations'

// Worker - notification processing
export {
  processNotification,
  processNotificationBatch,
  processNotificationBatchWithLimit,
  type BatchProcessingResult,
} from './worker'

// Channel processors - per-channel delivery logic
export {
  processEmailNotification,
  processInAppNotification,
  processSmsNotification,
  processWebhookNotification,
  getChannelProcessor,
  CHANNEL_PROCESSORS,
  type ProcessingResult,
} from './channel-processors'

// Retry logic
export {
  shouldRetryNotification,
  calculateRetryDelay,
  determineFinalStatus,
  classifyError,
  createErrorLogEntry,
  MAX_RETRY_ATTEMPTS,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  type RetryDecision,
} from './retry'

// Utilities
export {
  getNotificationRecipients,
  isValidEmail,
  sanitizeSubject,
  extractProjectId,
  extractUserId,
  formatTimestamp,
  truncateBody,
  type NotificationRecipient,
} from './utils'

// Main API - high-level functions for processing notifications

import { getQueuedNotifications as getNotifications } from './queue-operations'
import { processNotificationBatch as processBatch } from './worker'

/**
 * Process queued notifications
 *
 * High-level function that retrieves pending notifications and processes them.
 * This is the main entry point for the notification queue worker.
 *
 * @param limit - Maximum number of notifications to process (default: 10)
 * @returns Batch processing result
 */
export async function processQueuedNotifications(
  limit: number = 10
) {
  const notifications = await getNotifications(limit)

  if (notifications.length === 0) {
    console.log('[NotificationQueue] No notifications to process')
    return {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      results: [],
    }
  }

  return processBatch(notifications)
}
