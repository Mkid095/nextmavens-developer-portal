/**
 * Notification Retry Module
 * Functions for retrying failed notifications
 */

import { getPool } from '@/lib/db'
import { NotificationStatus as NotificationStatusEnum } from '../../types'

/**
 * Retry failed notifications
 *
 * @param maxAttempts - Maximum number of retry attempts
 * @returns Number of notifications retried
 */
export async function retryFailedNotifications(
  maxAttempts: number = 3
): Promise<number> {
  const pool = getPool()

  try {
    // Get failed notifications that haven't exceeded max attempts
    const result = await pool.query(
      `
      SELECT id, project_id, subject, body
      FROM notifications
      WHERE status = 'failed'
        AND attempts < $1
      ORDER BY created_at ASC
      LIMIT 10
      `,
      [maxAttempts]
    )

    let retriedCount = 0

    for (const row of result.rows) {
      try {
        // TODO: Re-send the notification based on its channels
        // For now, just mark as retrying
        await pool.query(
          `
          UPDATE notifications
          SET status = $1
          WHERE id = $2
          `,
          [NotificationStatusEnum.RETRYING, row.id]
        )

        // In production, you would re-send the notification here
        // based on the notification's channels

        retriedCount++
      } catch (error) {
        console.error(`[Notifications] Error retrying notification ${row.id}:`, error)
      }
    }

    console.log(`[Notifications] Retried ${retriedCount} failed notifications`)
    return retriedCount
  } catch (error) {
    console.error('[Notifications] Error retrying failed notifications:', error)
    throw new Error('Failed to retry failed notifications')
  }
}
