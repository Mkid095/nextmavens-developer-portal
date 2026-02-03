/**
 * Notification Recipients Module
 * Functions for getting and filtering notification recipients
 */

import { getPool } from '@/lib/db'
import type { NotificationRecipient, NotificationType } from '../../types'
import { NotificationType as NotificationTypeEnum } from '../../types'
import { shouldReceiveNotification } from '../notification-preferences'

/**
 * Get notification recipients for a project
 *
 * @param projectId - The project to get recipients for
 * @param notificationType - Type of notification to check preferences for
 * @returns Array of notification recipients
 */
export async function getNotificationRecipients(
  projectId: string,
  notificationType: NotificationType = NotificationTypeEnum.PROJECT_SUSPENDED
): Promise<NotificationRecipient[]> {
  const pool = getPool()

  try {
    // Query to get project owner and org members
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
    const enabledRecipients: NotificationRecipient[] = []

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
          `[Notifications] User ${recipient.id} has opted out of ${notificationType} notifications`
        )
      }
    }

    return enabledRecipients
  } catch (error) {
    console.error('[Notifications] Error getting notification recipients:', error)
    throw new Error('Failed to get notification recipients')
  }
}
