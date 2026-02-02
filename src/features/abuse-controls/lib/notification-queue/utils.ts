/**
 * Notification Queue Utilities
 *
 * Utility functions for the notification queue system, including
 * recipient management and helper functions.
 */

import { getPool } from '@/lib/db'
import type { NotificationType } from '../types'
import { shouldReceiveNotification } from '../notification-preferences'

/**
 * Notification recipient information
 */
export interface NotificationRecipient {
  id: string
  email: string
  name?: string
  role?: string
}

/**
 * Get notification recipients for a project
 *
 * Retrieves all users associated with a project (via organization membership)
 * and filters them based on their notification preferences.
 *
 * @param projectId - The project to get recipients for
 * @param notificationType - Type of notification to check preferences for
 * @returns Array of notification recipients who have opted in to this notification type
 */
export async function getNotificationRecipients(
  projectId: string,
  notificationType: NotificationType
): Promise<NotificationRecipient[]> {
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
 * Validate email format
 *
 * Basic email validation to catch obviously invalid email addresses
 * before attempting to send notifications.
 *
 * @param email - Email address to validate
 * @returns True if email appears valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize notification subject
 *
 * Removes potentially dangerous characters from notification subjects
 * to prevent injection attacks.
 *
 * @param subject - Raw subject string
 * @returns Sanitized subject string
 */
export function sanitizeSubject(subject: string): string {
  // Remove control characters and limit length
  return subject
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 500)
}

/**
 * Extract project ID from notification data
 *
 * Helper to safely extract project_id from notification data object.
 *
 * @param data - Notification data object
 * @returns Project ID or undefined if not found
 */
export function extractProjectId(data: Record<string, unknown>): string | undefined {
  const projectId = data.project_id
  return typeof projectId === 'string' ? projectId : undefined
}

/**
 * Extract user ID from notification data
 *
 * Helper to safely extract user_id from notification data object.
 *
 * @param data - Notification data object
 * @returns User ID or undefined if not found
 */
export function extractUserId(data: Record<string, unknown>): string | undefined {
  const userId = data.user_id
  return typeof userId === 'string' ? userId : undefined
}

/**
 * Format notification timestamp
 *
 * Formats a timestamp for display in notification messages.
 *
 * @param timestamp - Date object or ISO string
 * @returns Formatted timestamp string
 */
export function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toISOString()
}

/**
 * Truncate notification body
 *
 * Ensures notification body doesn't exceed maximum length.
 *
 * @param body - Body text to truncate
 * @param maxLength - Maximum length (default: 5000)
 * @returns Truncated body with ellipsis if needed
 */
export function truncateBody(body: string, maxLength: number = 5000): string {
  if (body.length <= maxLength) {
    return body
  }
  return body.substring(0, maxLength - 3) + '...'
}
