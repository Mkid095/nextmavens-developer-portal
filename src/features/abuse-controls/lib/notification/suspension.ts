/**
 * Suspension Notifications Module
 * Functions for sending suspension-related notifications
 */

import type { NotificationDeliveryResult, SuspensionReason } from '../types'
import {
  NotificationType as NotificationTypeEnum,
  NotificationPriority as NotificationPriorityEnum,
  NotificationStatus as NotificationStatusEnum,
  NotificationChannel as NotificationChannelEnum,
} from '../types'
import { logAuditEntry, AuditLogLevel } from '../lib/audit-logger'
import { getNotificationRecipients } from './recipients'
import { createSuspensionNotificationTemplate, formatSuspensionNotificationEmail } from './templates'
import { createNotification } from './database'
import { sendEmailNotification } from './email'
import { updateNotificationDeliveryStatus } from './database'

/**
 * Send suspension notification to project owner and org members
 *
 * @param projectId - The project that was suspended
 * @param projectName - The name of the project
 * @param orgName - The name of the organization
 * @param reason - The suspension reason
 * @param suspendedAt - When the suspension occurred
 * @returns Array of delivery results
 */
export async function sendSuspensionNotification(
  projectId: string,
  projectName: string,
  orgName: string,
  reason: SuspensionReason,
  suspendedAt: Date
): Promise<NotificationDeliveryResult[]> {
  const startTime = new Date()
  let success = false
  let deliveryCount = 0

  try {
    console.log(
      `[Notifications] Sending suspension notification for project ${projectId}`
    )

    // Create notification template
    const template = createSuspensionNotificationTemplate(
      projectName,
      orgName,
      reason,
      suspendedAt
    )

    // Format email content
    const { subject, body } = formatSuspensionNotificationEmail(template)

    // Get notification recipients (respecting their preferences)
    const recipients = await getNotificationRecipients(
      projectId,
      NotificationTypeEnum.PROJECT_SUSPENDED
    )

    if (recipients.length === 0) {
      console.warn(`[Notifications] No recipients found for project ${projectId}`)
      return []
    }

    // Create notification record in database
    const notificationId = await createNotification(
      projectId,
      NotificationTypeEnum.PROJECT_SUSPENDED,
      NotificationPriorityEnum.HIGH,
      subject,
      body,
      {
        reason,
        suspended_at: suspendedAt,
        recipients: recipients.map((r) => r.id),
      },
      [NotificationChannelEnum.EMAIL]
    )

    // Send notifications to all recipients
    const deliveryResults: NotificationDeliveryResult[] = []

    for (const recipient of recipients) {
      const result = await sendEmailNotification(recipient.email, subject, body)

      // Update notification record with delivery status
      await updateNotificationDeliveryStatus(
        notificationId,
        result.success ? NotificationStatusEnum.DELIVERED : NotificationStatusEnum.FAILED,
        result.error
      )

      deliveryResults.push({
        ...result,
        notification_id: notificationId,
      })
    }

    const successfulDeliveries = deliveryResults.filter((r) => r.success).length
    deliveryCount = successfulDeliveries
    success = successfulDeliveries > 0

    console.log(
      `[Notifications] Sent suspension notification to ${successfulDeliveries}/${recipients.length} recipients`
    )

    return deliveryResults
  } catch (error) {
    console.error('[Notifications] Error sending suspension notification:', error)

    // Log notification failure to audit log
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.ERROR,
      project_id: projectId,
      action: 'Suspension notification failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: new Date().getTime() - startTime.getTime(),
      },
      occurred_at: new Date(),
    }).catch((auditError) => {
      console.error('[Notifications] Failed to log audit entry:', auditError)
    })

    throw new Error('Failed to send suspension notification')
  } finally {
    // Log notification attempt to audit log
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: success ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
      project_id: projectId,
      action: 'Suspension notification sent',
      details: {
        success,
        delivery_count: deliveryCount,
        reason: reason.cap_type,
        duration_ms: new Date().getTime() - startTime.getTime(),
      },
      occurred_at: new Date(),
    }).catch((auditError) => {
      console.error('[Notifications] Failed to log audit entry:', auditError)
    })
  }
}
