/**
 * Notification Queue Worker
 *
 * Core notification processing logic. Handles the orchestration
 * of notification delivery through various channels.
 *
 * The actual channel-specific delivery logic is delegated to
 * channel-processors.ts to keep this module focused.
 */

import type { NotificationStatus } from '../types'
import type { QueuedNotification } from './queue-operations'
import { markNotificationAsProcessing } from './queue-operations'
import { getChannelProcessor, type ProcessingResult } from './channel-processors'
import { createErrorLogEntry } from './retry'

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
  totalProcessed: number
  successful: number
  failed: number
  results: ProcessingResult[]
}

/**
 * Process a single notification
 *
 * Handles the delivery of a notification through all its configured channels.
 * Each channel is processed sequentially, and the result is tracked.
 *
 * Processing flow:
 * 1. Mark notification as processing (to prevent duplicate processing)
 * 2. For each configured channel:
 *    - Invoke the appropriate channel processor
 *    - Handle success/failure and update notification status
 *    - Return on first completion (success or permanent failure)
 * 3. Return final processing result
 *
 * @param notification - The notification to process
 * @returns Processing result indicating success/failure
 */
export async function processNotification(
  notification: QueuedNotification
): Promise<ProcessingResult> {
  console.log(
    `[NotificationQueue] Processing notification ${notification.id} (${notification.notification_type})`
  )

  // Mark as processing
  await markNotificationAsProcessing(notification.id)

  // Process each channel
  for (const channel of notification.channels) {
    try {
      const processor = getChannelProcessor(channel)
      const result = await processor(notification)

      // Return the result (whether success or failure)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(createErrorLogEntry(error, {
        notificationId: notification.id,
        channel,
        attemptNumber: notification.attempts,
      }))

      return {
        notificationId: notification.id,
        success: false,
        channel,
        error: errorMessage,
      }
    }
  }

  // Should not reach here, but handle the case
  return {
    notificationId: notification.id,
    success: false,
    channel: 'email',
    error: 'No valid channels',
  }
}

/**
 * Process a batch of notifications
 *
 * Retrieves queued notifications and processes them in sequence.
 * Tracks success/failure counts and provides detailed results.
 *
 * @param notifications - Array of notifications to process
 * @returns Batch processing result with statistics
 */
export async function processNotificationBatch(
  notifications: QueuedNotification[]
): Promise<BatchProcessingResult> {
  const startTime = Date.now()

  console.log(`[NotificationQueue] Processing batch of ${notifications.length} notifications`)

  // Process each notification
  const results: ProcessingResult[] = []
  let successful = 0
  let failed = 0

  for (const notification of notifications) {
    const result = await processNotification(notification)
    results.push(result)

    if (result.success) {
      successful++
    } else {
      failed++
    }
  }

  const duration = Date.now() - startTime
  console.log(
    `[NotificationQueue] Batch processing complete: ${successful} successful, ${failed} failed, ${duration}ms`
  )

  return {
    totalProcessed: notifications.length,
    successful,
    failed,
    results,
  }
}

/**
 * Process queued notifications with limit
 *
 * Convenience function that processes up to a specified number of
 * pending notifications from the queue.
 *
 * @param notifications - Array of notifications to process
 * @param limit - Maximum number to process (default: all)
 * @returns Batch processing result
 */
export async function processNotificationBatchWithLimit(
  notifications: QueuedNotification[],
  limit: number = notifications.length
): Promise<BatchProcessingResult> {
  const notificationsToProcess = notifications.slice(0, limit)
  return processNotificationBatch(notificationsToProcess)
}
