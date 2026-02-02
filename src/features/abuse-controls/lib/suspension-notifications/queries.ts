/**
 * Suspension Notifications Module - Database Queries
 *
 * Database query functions for suspension notifications.
 */

import { getPool } from '@/lib/db'
import type { SuspensionNotification, SuspensionNotificationStatus } from '../../types'
import { SuspensionNotificationStatus as SuspensionNotificationStatusEnum } from '../../types'

/**
 * Get pending suspension notifications
 *
 * @returns Array of pending suspension notifications
 */
export async function getPendingNotifications(): Promise<SuspensionNotification[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        recipient_emails,
        reason,
        cap_exceeded,
        current_usage,
        limit,
        support_contact,
        status,
        sent_at,
        error,
        created_at
      FROM suspension_notifications
      WHERE status = $1
      ORDER BY created_at ASC
      `,
      [SuspensionNotificationStatusEnum.PENDING]
    )

    return result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      recipient_emails: row.recipient_emails,
      reason: row.reason,
      cap_exceeded: row.cap_exceeded,
      current_usage: row.current_usage,
      limit: row.limit,
      support_contact: row.support_contact,
      status: row.status as SuspensionNotificationStatus,
      sent_at: row.sent_at,
      error: row.error,
      created_at: row.created_at,
    }))
  } catch (error) {
    console.error('[SuspensionNotifications] Error getting pending notifications:', error)
    throw new Error('Failed to get pending notifications')
  }
}

/**
 * Mark a notification as sent
 *
 * @param notificationId - The notification ID to mark as sent
 * @returns Promise that resolves when notification is marked
 */
export async function markNotificationSent(notificationId: string): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      UPDATE suspension_notifications
      SET status = $1,
          sent_at = NOW()
      WHERE id = $2
      `,
      [SuspensionNotificationStatusEnum.SENT, notificationId]
    )

    console.log(`[SuspensionNotifications] Marked notification ${notificationId} as sent`)
  } catch (error) {
    console.error('[SuspensionNotifications] Error marking notification as sent:', error)
    throw new Error('Failed to mark notification as sent')
  }
}

/**
 * Mark a notification as failed
 *
 * @param notificationId - The notification ID to mark as failed
 * @param error - Error message describing the failure
 * @returns Promise that resolves when notification is marked
 */
export async function markNotificationFailed(
  notificationId: string,
  error: string
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      UPDATE suspension_notifications
      SET status = $1,
          error = $2
      WHERE id = $3
      `,
      [SuspensionNotificationStatusEnum.FAILED, error, notificationId]
    )

    console.log(`[SuspensionNotifications] Marked notification ${notificationId} as failed`)
  } catch (error) {
    console.error('[SuspensionNotifications] Error marking notification as failed:', error)
    throw new Error('Failed to mark notification as failed')
  }
}

/**
 * Get suspension notifications for a project
 *
 * @param projectId - The project ID
 * @param limit - Maximum number of notifications to return
 * @returns Array of suspension notifications
 */
export async function getProjectSuspensionNotifications(
  projectId: string,
  limit: number = 50
): Promise<SuspensionNotification[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        recipient_emails,
        reason,
        cap_exceeded,
        current_usage,
        limit,
        support_contact,
        status,
        sent_at,
        error,
        created_at
      FROM suspension_notifications
      WHERE project_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [projectId, limit]
    )

    return result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      recipient_emails: row.recipient_emails,
      reason: row.reason,
      cap_exceeded: row.cap_exceeded,
      current_usage: row.current_usage,
      limit: row.limit,
      support_contact: row.support_contact,
      status: row.status as SuspensionNotificationStatus,
      sent_at: row.sent_at,
      error: row.error,
      created_at: row.created_at,
    }))
  } catch (error) {
    console.error('[SuspensionNotifications] Error getting project notifications:', error)
    throw new Error('Failed to get project suspension notifications')
  }
}

/**
 * Get a single suspension notification by ID
 *
 * @param notificationId - The notification ID
 * @returns The notification record or null
 */
export async function getSuspensionNotification(
  notificationId: string
): Promise<SuspensionNotification | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        recipient_emails,
        reason,
        cap_exceeded,
        current_usage,
        limit,
        support_contact,
        status,
        sent_at,
        error,
        created_at
      FROM suspension_notifications
      WHERE id = $1
      `,
      [notificationId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]

    return {
      id: row.id,
      project_id: row.project_id,
      recipient_emails: row.recipient_emails,
      reason: row.reason,
      cap_exceeded: row.cap_exceeded,
      current_usage: row.current_usage,
      limit: row.limit,
      support_contact: row.support_contact,
      status: row.status as SuspensionNotificationStatus,
      sent_at: row.sent_at,
      error: row.error,
      created_at: row.created_at,
    }
  } catch (error) {
    console.error('[SuspensionNotifications] Error getting notification:', error)
    throw new Error('Failed to get suspension notification')
  }
}
