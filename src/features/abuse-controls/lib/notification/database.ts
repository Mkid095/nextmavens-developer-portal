/**
 * Notification Database Module
 * Functions for database operations on notifications
 */

import { getPool } from '@/lib/db'
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
} from '../types'
import {
  NotificationStatus as NotificationStatusEnum,
} from '../types'
import { logAuditEntry, AuditLogLevel } from '../lib/audit-logger'

/**
 * Create a notification record in the database
 *
 * @param projectId - The project ID
 * @param notificationType - Type of notification
 * @param priority - Notification priority
 * @param subject - Notification subject
 * @param body - Notification body
 * @param data - Additional notification data
 * @param channels - Delivery channels
 * @returns The created notification ID
 */
export async function createNotification(
  projectId: string,
  notificationType: NotificationType,
  priority: NotificationPriority,
  subject: string,
  body: string,
  data: Record<string, unknown>,
  channels: NotificationChannel[]
): Promise<string> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO notifications (
        project_id,
        notification_type,
        priority,
        subject,
        body,
        data,
        channels,
        status,
        attempts,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
      `,
      [
        projectId,
        notificationType,
        priority,
        subject,
        body,
        JSON.stringify(data),
        channels,
        NotificationStatusEnum.PENDING,
        0,
      ]
    )

    const notificationId = result.rows[0].id
    console.log(`[Notifications] Created notification ${notificationId}`)

    // Log notification creation to audit log
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.INFO,
      project_id: projectId,
      action: 'Notification created',
      details: {
        notification_id: notificationId,
        notification_type: notificationType,
        priority,
        channels,
      },
      occurred_at: new Date(),
    })

    return notificationId
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error)
    throw new Error('Failed to create notification')
  }
}

/**
 * Update notification delivery status
 *
 * @param notificationId - The notification ID
 * @param status - The new delivery status
 * @param errorMessage - Optional error message
 */
export async function updateNotificationDeliveryStatus(
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

    console.log(`[Notifications] Updated notification ${notificationId} status to ${status}`)
  } catch (error) {
    console.error('[Notifications] Error updating notification status:', error)
    throw new Error('Failed to update notification status')
  }
}

/**
 * Get notification by ID
 *
 * @param notificationId - The notification ID
 * @returns The notification record or null
 */
export async function getNotification(
  notificationId: string
): Promise<Notification | null> {
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
        status,
        attempts,
        created_at,
        delivered_at,
        error_message
      FROM notifications
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
      notification_type: row.notification_type as NotificationType,
      priority: row.priority as NotificationPriority,
      subject: row.subject,
      body: row.body,
      data: row.data,
      channels: row.channels as NotificationChannel[],
      status: row.status as NotificationStatus,
      attempts: row.attempts,
      created_at: row.created_at,
      delivered_at: row.delivered_at,
      error_message: row.error_message,
    }
  } catch (error) {
    console.error('[Notifications] Error getting notification:', error)
    throw new Error('Failed to get notification')
  }
}

/**
 * Get notifications for a project
 *
 * @param projectId - The project ID
 * @param limit - Maximum number of notifications to return
 * @returns Array of notifications
 */
export async function getProjectNotifications(
  projectId: string,
  limit: number = 50
): Promise<Notification[]> {
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
        status,
        attempts,
        created_at,
        delivered_at,
        error_message
      FROM notifications
      WHERE project_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [projectId, limit]
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
      status: row.status as NotificationStatus,
      attempts: row.attempts,
      created_at: row.created_at,
      delivered_at: row.delivered_at,
      error_message: row.error_message,
    }))
  } catch (error) {
    console.error('[Notifications] Error getting project notifications:', error)
    throw new Error('Failed to get project notifications')
  }
}
