/**
 * Suspension Notifications Module - Sending Functions
 *
 * Manages suspension-specific notifications for projects that exceed hard caps.
 */

import { getPool } from '@/lib/db'
import type { SuspensionNotificationParams } from '../../types'
import { SuspensionNotificationStatus as SuspensionNotificationStatusEnum } from '../../types'
import { logAuditEntry, AuditLogLevel } from '../audit-logger'
import { sendHtmlEmail } from '../email-service'
import { getDefaultSuspensionNotificationTemplate } from '../config'
import { markNotificationSent, markNotificationFailed } from './queries'

/**
 * Send a suspension notification
 *
 * @param params - Suspension notification parameters
 * @returns Promise that resolves when notification is sent
 */
export async function sendSuspensionNotification(
  params: SuspensionNotificationParams
): Promise<void> {
  const pool = getPool()

  try {
    console.log(
      `[SuspensionNotifications] Sending suspension notification for project ${params.projectId}`
    )

    // Create suspension notification record
    const result = await pool.query(
      `
      INSERT INTO suspension_notifications (
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
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL, NOW())
      RETURNING id
      `,
      [
        params.projectId,
        params.recipientEmails,
        params.reason,
        params.capExceeded,
        params.currentUsage,
        params.limit,
        params.supportContact,
        SuspensionNotificationStatusEnum.PENDING,
      ]
    )

    const notificationId = result.rows[0].id
    console.log(`[SuspensionNotifications] Created notification ${notificationId}`)

    // Generate email template
    const template = getDefaultSuspensionNotificationTemplate(
      params.projectId, // Using projectId as projectName for now
      'Organization', // Using placeholder for orgName
      params.capExceeded,
      params.currentUsage,
      params.limit
    )

    // Send emails to all recipients
    const sendResults: Array<{ success: boolean; error?: string }> = []
    for (const recipientEmail of params.recipientEmails) {
      const sendResult = await sendHtmlEmail(
        recipientEmail,
        template.subject,
        template.body,
        template.plainText
      )
      sendResults.push(sendResult)

      // Add a small delay between sends to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Check if all emails were sent successfully
    const allSuccessful = sendResults.every((result) => result.success)

    if (allSuccessful) {
      await markNotificationSent(notificationId)
      console.log(
        `[SuspensionNotifications] Successfully sent ${sendResults.length} email(s) for notification ${notificationId}`
      )
    } else {
      const failedCount = sendResults.filter((r) => !r.success).length
      const errorMessages = sendResults
        .filter((r) => r.error)
        .map((r) => r.error)
        .join('; ')

      await markNotificationFailed(notificationId, `Failed to send ${failedCount} email(s): ${errorMessages}`)
      console.error(
        `[SuspensionNotifications] Failed to send ${failedCount} email(s) for notification ${notificationId}: ${errorMessages}`
      )

      // Log to audit even on failure
      await logAuditEntry({
        log_type: 'suspension_notification' as any,
        severity: AuditLogLevel.ERROR,
        project_id: params.projectId,
        action: 'Suspension notification failed',
        details: {
          notification_id: notificationId,
          cap_exceeded: params.capExceeded,
          recipients: params.recipientEmails.length,
          error: errorMessages,
        },
        occurred_at: new Date(),
      })

      throw new Error(`Failed to send suspension notification: ${errorMessages}`)
    }

    // Log to audit on success
    await logAuditEntry({
      log_type: 'suspension_notification' as any,
      severity: AuditLogLevel.INFO,
      project_id: params.projectId,
      action: 'Suspension notification sent',
      details: {
        notification_id: notificationId,
        cap_exceeded: params.capExceeded,
        recipients: params.recipientEmails.length,
      },
      occurred_at: new Date(),
    })
  } catch (error) {
    console.error('[SuspensionNotifications] Error sending notification:', error)
    throw new Error('Failed to send suspension notification')
  }
}
