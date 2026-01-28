/**
 * Notification Queue/Processing System
 *
 * Manages the queue of pending notifications and processes them asynchronously.
 * Provides retry logic, failure handling, and delivery tracking.
 */

import { getPool } from '@/lib/db'
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
} from '../types'
import { sendEmailNotification } from './notifications'
import { shouldReceiveNotification } from './notification-preferences'

/**
 * Queued notification for processing
 */
export interface QueuedNotification {
  id: string
  project_id: string
  notification_type: NotificationType
  priority: NotificationPriority
  subject: string
  body: string
  data: Record<string, unknown>
  channels: NotificationChannel[]
  attempts: number
}

/**
 * Notification processing result
 */
export interface ProcessingResult {
  notificationId: string
  success: boolean
  channel: NotificationChannel
  error?: string
}

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
 * Get pending notifications from the queue
 *
 * @param limit - Maximum number of notifications to retrieve
 * @returns Array of queued notifications
 */
export async function getQueuedNotifications(
  limit: number = 10
): Promise<QueuedNotification[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        notification_type,
        priority,
        subject,
        body,
        data,
        channels,
        attempts
      FROM notifications
      WHERE status = 'pending'
        OR (status = 'failed' AND attempts < 3)
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END ASC,
        created_at ASC
      LIMIT $1
      `,
      [limit]
    )

    return result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      notification_type: row.notification_type as NotificationType,
      priority: row.priority as NotificationPriority,
      subject: row.subject,
      body: row.body,
      data: row.data,
      channels: row.channels as NotificationChannel[],
      attempts: row.attempts,
    }))
  } catch (error) {
    console.error('[NotificationQueue] Error getting queued notifications:', error)
    throw new Error('Failed to get queued notifications')
  }
}

/**
 * Mark notification as processing
 *
 * @param notificationId - The notification ID
 */
export async function markNotificationAsProcessing(notificationId: string): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      UPDATE notifications
      SET status = 'retrying'
      WHERE id = $1
      `,
      [notificationId]
    )

    console.log(`[NotificationQueue] Marked notification ${notificationId} as processing`)
  } catch (error) {
    console.error('[NotificationQueue] Error marking notification as processing:', error)
    throw new Error('Failed to mark notification as processing')
  }
}

/**
 * Update notification delivery result
 *
 * @param notificationId - The notification ID
 * @param status - The delivery status
 * @param errorMessage - Optional error message
 */
export async function updateNotificationResult(
  notificationId: string,
  status: NotificationStatus,
  errorMessage?: string
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      UPDATE notifications
      SET status = $1,
          delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END,
          error_message = $2,
          attempts = attempts + 1
      WHERE id = $3
      `,
      [status, errorMessage || null, notificationId]
    )

    console.log(`[NotificationQueue] Updated notification ${notificationId} to ${status}`)
  } catch (error) {
    console.error('[NotificationQueue] Error updating notification result:', error)
    throw new Error('Failed to update notification result')
  }
}

/**
 * Process a single notification
 *
 * @param notification - The notification to process
 * @returns Processing result
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
      switch (channel) {
        case 'email':
          // Get notification recipients (respecting their preferences)
          const recipients = await getNotificationRecipients(
            notification.project_id,
            notification.notification_type
          )

          if (recipients.length === 0) {
            console.warn(
              `[NotificationQueue] No recipients found for notification ${notification.id}`
            )
            await updateNotificationResult(
              notification.id,
              NotificationStatus.FAILED,
              'No recipients found'
            )
            return {
              notificationId: notification.id,
              success: false,
              channel,
              error: 'No recipients found',
            }
          }

          // Send to all recipients
          let allSuccessful = true
          let lastError: string | undefined

          for (const recipient of recipients) {
            const result = await sendEmailNotification(
              recipient.email,
              notification.subject,
              notification.body
            )

            if (!result.success) {
              allSuccessful = false
              lastError = result.error
            }
          }

          // Update notification status
          if (allSuccessful) {
            await updateNotificationResult(notification.id, NotificationStatus.DELIVERED)
            return {
              notificationId: notification.id,
              success: true,
              channel,
            }
          } else {
            await updateNotificationResult(
              notification.id,
              NotificationStatus.FAILED,
              lastError
            )
            return {
              notificationId: notification.id,
              success: false,
              channel,
              error: lastError,
            }
          }

        case 'in_app':
          // TODO: Implement in-app notification delivery
          console.log(`[NotificationQueue] In-app notifications not yet implemented`)
          await updateNotificationResult(
            notification.id,
            NotificationStatus.DELIVERED,
            undefined
          )
          return {
            notificationId: notification.id,
            success: true,
            channel,
          }

        case 'sms':
          // TODO: Implement SMS notification delivery
          console.log(`[NotificationQueue] SMS notifications not yet implemented`)
          await updateNotificationResult(
            notification.id,
            NotificationStatus.FAILED,
            'SMS not implemented'
          )
          return {
            notificationId: notification.id,
            success: false,
            channel,
            error: 'SMS not implemented',
          }

        case 'webhook':
          // TODO: Implement webhook notification delivery
          console.log(`[NotificationQueue] Webhook notifications not yet implemented`)
          await updateNotificationResult(
            notification.id,
            NotificationStatus.FAILED,
            'Webhook not implemented'
          )
          return {
            notificationId: notification.id,
            success: false,
            channel,
            error: 'Webhook not implemented',
          }

        default:
          await updateNotificationResult(
            notification.id,
            NotificationStatus.FAILED,
            `Unknown channel: ${channel}`
          )
          return {
            notificationId: notification.id,
            success: false,
            channel,
            error: `Unknown channel: ${channel}`,
          }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(
        `[NotificationQueue] Error processing notification ${notification.id}:`,
        errorMessage
      )
      await updateNotificationResult(notification.id, NotificationStatus.FAILED, errorMessage)
      return {
        notificationId: notification.id,
        success: false,
        channel,
        error: errorMessage,
      }
    }
  }

  // Should not reach here, but handle the case
  await updateNotificationResult(
    notification.id,
    NotificationStatus.FAILED,
    'No valid channels'
  )
  return {
    notificationId: notification.id,
    success: false,
    channel: NotificationChannel.EMAIL,
    error: 'No valid channels',
  }
}

/**
 * Process a batch of notifications
 *
 * @param limit - Maximum number of notifications to process
 * @returns Batch processing result
 */
export async function processNotificationBatch(
  limit: number = 10
): Promise<BatchProcessingResult> {
  console.log(`[NotificationQueue] Processing batch of up to ${limit} notifications`)

  const startTime = Date.now()

  try {
    // Get queued notifications
    const notifications = await getQueuedNotifications(limit)

    if (notifications.length === 0) {
      console.log('[NotificationQueue] No notifications to process')
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        results: [],
      }
    }

    console.log(`[NotificationQueue] Processing ${notifications.length} notifications`)

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
  } catch (error) {
    console.error('[NotificationQueue] Error processing batch:', error)
    throw new Error('Failed to process notification batch')
  }
}

/**
 * Get notification recipients (copied from notifications.ts for internal use)
 *
 * @param projectId - The project to get recipients for
 * @param notificationType - Type of notification to check preferences for
 * @returns Array of notification recipients
 */
async function getNotificationRecipients(
  projectId: string,
  notificationType: NotificationType
): Promise<
  Array<{
    id: string
    email: string
    name?: string
    role?: string
  }>
> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT DISTINCT
        u.id as user_id,
        u.email,
        u.name,
        om.role as org_role
      FROM projects p
      JOIN organizations o ON p.org_id = o.id
      LEFT JOIN organization_members om ON o.id = om.org_id
      LEFT JOIN users u ON om.user_id = u.id OR o.owner_id = u.id
      WHERE p.id = $1
        AND u.id IS NOT NULL
      `,
      [projectId]
    )

    const allRecipients = result.rows.map((row) => ({
      id: row.user_id,
      email: row.email,
      name: row.name || undefined,
      role: row.org_role || undefined,
    }))

    // Filter recipients based on notification preferences
    const enabledRecipients = []

    for (const recipient of allRecipients) {
      const shouldReceive = await shouldReceiveNotification(
        recipient.id,
        notificationType,
        projectId
      )

      if (shouldReceive) {
        enabledRecipients.push(recipient)
      } else {
        console.log(
          `[NotificationQueue] User ${recipient.id} has opted out of ${notificationType} notifications`
        )
      }
    }

    return enabledRecipients
  } catch (error) {
    console.error('[NotificationQueue] Error getting notification recipients:', error)
    throw new Error('Failed to get notification recipients')
  }
}

/**
 * Get queue statistics
 *
 * @returns Queue statistics
 */
export async function getQueueStatistics(): Promise<{
  pending: number
  failed: number
  retrying: number
  total: number
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'retrying') as retrying,
        COUNT(*) as total
      FROM notifications
      `
    )

    const row = result.rows[0]

    return {
      pending: parseInt(row.pending, 10),
      failed: parseInt(row.failed, 10),
      retrying: parseInt(row.retrying, 10),
      total: parseInt(row.total, 10),
    }
  } catch (error) {
    console.error('[NotificationQueue] Error getting queue statistics:', error)
    throw new Error('Failed to get queue statistics')
  }
}

/**
 * Clean up old delivered notifications
 *
 * @param daysToKeep - Number of days to keep notifications (default: 30)
 * @returns Number of notifications deleted
 */
export async function cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      DELETE FROM notifications
      WHERE status = 'delivered'
        AND delivered_at < NOW() - INTERVAL '1 day' * $1
      `,
      [daysToKeep]
    )

    const deletedCount = result.rowCount || 0
    console.log(`[NotificationQueue] Cleaned up ${deletedCount} old notifications`)

    return deletedCount
  } catch (error) {
    console.error('[NotificationQueue] Error cleaning up old notifications:', error)
    throw new Error('Failed to cleanup old notifications')
  }
}
