/**
 * Notification Queue Database Operations
 *
 * Handles all database operations for the notification queue system,
 * including retrieving, updating, and cleaning up notifications.
 */

import { getPool } from '@/lib/db'
import type {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
} from '../types'

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
 * Queue statistics
 */
export interface QueueStatistics {
  pending: number
  failed: number
  retrying: number
  total: number
}

/**
 * Get pending notifications from the queue
 *
 * Retrieves notifications that are either:
 * - In 'pending' status (never attempted)
 * - In 'failed' status with less than 3 retry attempts
 *
 * Results are ordered by priority (critical first) and creation date.
 *
 * @param limit - Maximum number of notifications to retrieve (default: 10)
 * @returns Array of queued notifications sorted by priority and creation date
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
 * Updates the notification status to 'retrying' to indicate that
 * processing has begun and prevent duplicate processing.
 *
 * @param notificationId - The notification ID to mark as processing
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
 * Records the outcome of notification delivery attempt, including:
 * - Final status (delivered, failed)
 * - Delivery timestamp (when successful)
 * - Error message (when failed)
 * - Increment attempt counter
 *
 * @param notificationId - The notification ID to update
 * @param status - The delivery status to set
 * @param errorMessage - Optional error message for failed deliveries
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
 * Get queue statistics
 *
 * Provides counts of notifications in various states to monitor
 * queue health and processing backlog.
 *
 * @returns Object containing counts for pending, failed, retrying, and total notifications
 */
export async function getQueueStatistics(): Promise<QueueStatistics> {
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
 * Removes successfully delivered notifications older than the specified
 * retention period to prevent unlimited table growth.
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
