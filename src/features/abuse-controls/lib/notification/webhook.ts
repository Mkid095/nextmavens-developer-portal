/**
 * Webhook Notifications Module
 * Functions for sending webhook-related notifications
 */

import { getPool } from '@/lib/db'
import type { NotificationDeliveryResult } from '../../types'
import {
  NotificationType as NotificationTypeEnum,
  NotificationPriority as NotificationPriorityEnum,
  NotificationStatus as NotificationStatusEnum,
  NotificationChannel as NotificationChannelEnum,
} from '../../types'
import { logAuditEntry, AuditLogLevel } from '../audit-logger'
import { getNotificationRecipients } from './recipients'
import { createNotification } from './database'
import { sendEmailNotification } from './email'
import { updateNotificationDeliveryStatus } from './database'

/**
 * Send webhook disabled notification to project owner and org members
 *
 * US-011: Disable Failed Webhooks
 * Sends notification when a webhook is automatically disabled after 5 consecutive failures
 *
 * @param projectId - The project ID
 * @param webhookId - The webhook ID that was disabled
 * @param eventType - The event type the webhook was subscribed to
 * @param targetUrl - The target URL of the webhook
 * @param consecutiveFailures - Number of consecutive failures
 * @returns Array of delivery results
 */
export async function sendWebhookDisabledNotification(
  projectId: string,
  webhookId: string,
  eventType: string,
  targetUrl: string,
  consecutiveFailures: number
): Promise<NotificationDeliveryResult[]> {
  const startTime = new Date()
  let success = false
  let deliveryCount = 0

  try {
    console.log(
      `[Notifications] Sending webhook disabled notification for webhook ${webhookId}`
    )

    // Get project and organization details
    const pool = getPool()
    const projectResult = await pool.query(
      `
      SELECT p.name as project_name, o.name as org_name
      FROM projects p
      JOIN organizations o ON p.org_id = o.id
      WHERE p.id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      console.warn(`[Notifications] Project ${projectId} not found`)
      return []
    }

    const { project_name, org_name } = projectResult.rows[0]

    // Format email content
    const subject = `[Alert] Webhook Disabled - "${project_name}" (${org_name})`

    const body = `
IMPORTANT: Your webhook has been automatically disabled

Project: ${project_name}
Organization: ${org_name}
Webhook ID: ${webhookId}
Event Type: ${eventType}
Target URL: ${targetUrl}

What Happened:
Your webhook has been automatically disabled after ${consecutiveFailures} consecutive delivery failures.
This prevents endless retry attempts that could consume resources.

Why This Happened:
Webhooks are disabled after 5 consecutive delivery failures. Common causes include:
- The target URL is unreachable or returns errors
- The target server is down or misconfigured
- Network connectivity issues
- The webhook endpoint returns non-2xx status codes

How to Resolve This Issue:
1. Check your webhook endpoint is accessible and responding correctly
2. Verify the target URL is correct
3. Review the webhook delivery history in your dashboard
4. Fix any issues with your webhook endpoint
5. Re-enable the webhook from the webhooks management page

Need Help?
If you believe this is an error or need assistance, please contact our support team.
Please include your project ID and webhook ID in your correspondence.

---
This is an automated notification. Please do not reply directly to this email.
`.trim()

    // Get notification recipients
    const recipients = await getNotificationRecipients(
      projectId,
      NotificationTypeEnum.WEBHOOK_DISABLED
    )

    if (recipients.length === 0) {
      console.warn(`[Notifications] No recipients found for project ${projectId}`)
      return []
    }

    // Create notification record in database
    const notificationId = await createNotification(
      projectId,
      NotificationTypeEnum.WEBHOOK_DISABLED,
      NotificationPriorityEnum.HIGH,
      subject,
      body,
      {
        webhook_id: webhookId,
        event_type: eventType,
        target_url: targetUrl,
        consecutive_failures: consecutiveFailures,
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
      `[Notifications] Sent webhook disabled notification to ${successfulDeliveries}/${recipients.length} recipients`
    )

    return deliveryResults
  } catch (error) {
    console.error('[Notifications] Error sending webhook disabled notification:', error)

    // Log notification failure to audit log
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.ERROR,
      project_id: projectId,
      action: 'Webhook disabled notification failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhook_id: webhookId,
        duration_ms: new Date().getTime() - startTime.getTime(),
      },
      occurred_at: new Date(),
    }).catch((auditError) => {
      console.error('[Notifications] Failed to log audit entry:', auditError)
    })

    throw new Error('Failed to send webhook disabled notification')
  } finally {
    // Log notification attempt to audit log
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: success ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
      project_id: projectId,
      action: 'Webhook disabled notification sent',
      details: {
        success,
        delivery_count: deliveryCount,
        webhook_id: webhookId,
        event_type: eventType,
        duration_ms: new Date().getTime() - startTime.getTime(),
      },
      occurred_at: new Date(),
    }).catch((auditError) => {
      console.error('[Notifications] Failed to log audit entry:', auditError)
    })
  }
}
