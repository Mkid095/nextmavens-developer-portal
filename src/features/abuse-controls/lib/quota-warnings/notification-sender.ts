/**
 * Notification Sender
 *
 * Sends quota warning notifications via email and stores in database.
 * US-005: Implement Quota Warnings
 */

import { getPool } from '@/lib/db'
import {
  createNotification,
  sendEmailNotification,
  getNotificationRecipients,
} from '../notifications'
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../../types'
import { logAuditEntry, AuditLogLevel } from '../audit-logger'
import {
  QuotaWarningLevel,
  QuotaWarningEmail,
  QuotaWarningJobSummary,
} from './types'
import { getWarningUrgency, getWarningThreshold } from './constants'

/**
 * Create quota warning email content
 *
 * @param projectName - Project name
 * @param service - Service name
 * @param warningLevel - Warning level
 * @param currentUsage - Current usage
 * @param monthlyLimit - Monthly limit
 * @param usagePercentage - Usage percentage
 * @param resetAt - When quota resets
 * @returns Email subject and body
 */
export function createQuotaWarningEmail(
  projectName: string,
  service: string,
  warningLevel: QuotaWarningLevel,
  currentUsage: number,
  monthlyLimit: number,
  usagePercentage: number,
  resetAt: Date
): QuotaWarningEmail {
  const threshold = getWarningThreshold(warningLevel)
  const urgency = getWarningUrgency(warningLevel)

  const subject = `[${urgency}] Quota Warning: ${projectName} at ${usagePercentage}% of ${service} limit`

  const body = `
${urgency}: Your project is approaching its quota limit

Project: ${projectName}
Service: ${service}
Current Usage: ${currentUsage.toLocaleString()}
Monthly Limit: ${monthlyLimit.toLocaleString()}
Usage: ${usagePercentage}% (${threshold}% threshold reached)

What This Means:
Your project has used ${usagePercentage}% of its monthly ${service} quota.
If you exceed your quota, your project may be temporarily suspended.

Reset Date:
Your quota will reset on ${resetAt.toLocaleDateString()}

Recommended Actions:
1. Review your usage metrics in the developer dashboard
2. Identify the source of high ${service} usage
3. Optimize your application to reduce consumption
4. Consider upgrading your plan if you need more quota
5. Contact support if you need immediate assistance

Need Help?
If you believe this is an error or need assistance, please contact support.

---
This is an automated notification. Please do not reply directly to this email.
`.trim()

  return { subject, body }
}

/**
 * Check if a warning should be sent based on usage percentage
 * Prevents duplicate warnings at the same level
 *
 * @param pool - Database pool
 * @param projectId - Project ID
 * @param service - Service name
 * @param warningLevel - Warning level to check
 * @returns True if warning should be sent, false if already sent
 */
async function shouldSendWarning(
  pool: any,
  projectId: string,
  service: string,
  warningLevel: QuotaWarningLevel
): Promise<boolean> {
  try {
    // Get the start of the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Check if we've already sent this warning level this month
    const result = await pool.query(
      `
      SELECT id
      FROM notifications
      WHERE project_id = $1
        AND notification_type = 'quota_warning'
        AND data->>'service' = $2
        AND data->>'warning_level' = $3
        AND created_at >= $4
      `,
      [projectId, service, warningLevel, startOfMonth]
    )

    // If we've already sent this warning, don't send again
    return result.rows.length === 0
  } catch (error) {
    console.error('[NotificationSender] Error checking if warning should be sent:', error)
    // On error, allow the warning to be sent (fail open)
    return true
  }
}

/**
 * Send quota warning notification
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param service - Service name
 * @param warningLevel - Warning level (80% or 90%)
 * @param currentUsage - Current usage
 * @param monthlyLimit - Monthly limit
 * @param usagePercentage - Usage percentage
 * @param resetAt - When quota resets
 * @returns Number of notifications sent
 */
export async function sendQuotaWarning(
  projectId: string,
  projectName: string,
  service: string,
  warningLevel: QuotaWarningLevel,
  currentUsage: number,
  monthlyLimit: number,
  usagePercentage: number,
  resetAt: Date
): Promise<number> {
  const pool = getPool()
  const startTime = new Date()
  let success = false
  let deliveryCount = 0

  try {
    console.log(
      `[NotificationSender] Sending ${warningLevel} warning for project ${projectId}, service ${service}`
    )

    // Check if we should send this warning (prevent duplicates)
    const shouldSend = await shouldSendWarning(pool, projectId, service, warningLevel)
    if (!shouldSend) {
      console.log(
        `[NotificationSender] Warning ${warningLevel} already sent for ${service} this month, skipping`
      )
      return 0
    }

    // Create email content
    const { subject, body } = createQuotaWarningEmail(
      projectName,
      service,
      warningLevel,
      currentUsage,
      monthlyLimit,
      usagePercentage,
      resetAt
    )

    // Get notification recipients
    const recipients = await getNotificationRecipients(
      projectId,
      NotificationType.QUOTA_WARNING
    )

    if (recipients.length === 0) {
      console.warn(`[NotificationSender] No recipients found for project ${projectId}`)
      return 0
    }

    // Create notification record in database
    await createNotification(
      projectId,
      NotificationType.QUOTA_WARNING,
      warningLevel === QuotaWarningLevel.WARNING_90
        ? NotificationPriority.HIGH
        : NotificationPriority.MEDIUM,
      subject,
      body,
      {
        service,
        warning_level: warningLevel,
        current_usage: currentUsage,
        monthly_limit: monthlyLimit,
        usage_percentage: usagePercentage,
        reset_at: resetAt.toISOString(),
      },
      [NotificationChannel.EMAIL]
    )

    // Send notifications to all recipients
    let successCount = 0
    for (const recipient of recipients) {
      const result = await sendEmailNotification(recipient.email, subject, body)
      if (result.success) {
        successCount++
      }
    }

    deliveryCount = successCount
    success = successCount > 0

    console.log(
      `[NotificationSender] Sent ${warningLevel} warning to ${successCount}/${recipients.length} recipients`
    )

    return successCount
  } catch (error) {
    console.error('[NotificationSender] Error sending quota warning:', error)

    // Log failure to audit log
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.ERROR,
      project_id: projectId,
      action: 'Quota warning failed',
      details: {
        service,
        warning_level: warningLevel,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: new Date().getTime() - startTime.getTime(),
      },
      occurred_at: new Date(),
    }).catch((auditError) => {
      console.error('[NotificationSender] Failed to log audit entry:', auditError)
    })

    return 0
  } finally {
    // Log notification attempt to audit log
    if (success) {
      await logAuditEntry({
        log_type: 'notification' as any,
        severity: AuditLogLevel.INFO,
        project_id: projectId,
        action: 'Quota warning sent',
        details: {
          service,
          warning_level: warningLevel,
          delivery_count: deliveryCount,
          duration_ms: new Date().getTime() - startTime.getTime(),
        },
        occurred_at: new Date(),
      }).catch((auditError) => {
        console.error('[NotificationSender] Failed to log audit entry:', auditError)
      })
    }
  }
}
