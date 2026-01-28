/**
 * Notification Library
 *
 * Manages notification delivery for suspension events and other abuse control alerts.
 * Provides functions to create, send, and track notifications to project owners and org members.
 */

import { getPool } from '@/lib/db'
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  NotificationRecipient,
  SuspensionNotificationTemplate,
  NotificationDeliveryResult,
  SuspensionReason,
} from '../types'
import {
  NotificationType as NotificationTypeEnum,
  NotificationPriority as NotificationPriorityEnum,
  NotificationStatus as NotificationStatusEnum,
  NotificationChannel as NotificationChannelEnum,
} from '../types'
import { sendPlainTextEmail, type EmailSendResult } from './email-service'
import { shouldReceiveNotification } from './notification-preferences'

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

/**
 * Create a suspension notification template
 *
 * @param projectName - The name of the suspended project
 * @param orgName - The name of the organization
 * @param reason - The suspension reason
 * @param suspendedAt - When the suspension occurred
 * @returns Formatted notification template
 */
export function createSuspensionNotificationTemplate(
  projectName: string,
  orgName: string,
  reason: SuspensionReason,
  suspendedAt: Date
): SuspensionNotificationTemplate {
  // Generate resolution steps based on the cap type
  const resolutionSteps: string[] = [
    'Review your usage metrics in the developer dashboard',
    'Identify the source of the exceeded limit',
    'Optimize your application to reduce usage',
    'Consider upgrading your plan if needed',
    'Contact support for assistance',
  ]

  // Add specific steps based on cap type
  switch (reason.cap_type) {
    case 'db_queries_per_day':
      resolutionSteps.unshift(
        'Review your database queries for inefficiencies',
        'Implement query caching where appropriate',
        'Check for N+1 query patterns'
      )
      break
    case 'realtime_connections':
      resolutionSteps.unshift(
        'Review your realtime connection management',
        'Implement connection pooling',
        'Ensure connections are properly closed'
      )
      break
    case 'storage_uploads_per_day':
      resolutionSteps.unshift(
        'Review your file upload patterns',
        'Implement file compression',
        'Consider batching uploads'
      )
      break
    case 'function_invocations_per_day':
      resolutionSteps.unshift(
        'Review your function invocation patterns',
        'Implement function result caching',
        'Check for unintended recursive calls'
      )
      break
  }

  return {
    project_name: projectName,
    org_name: orgName,
    reason,
    suspended_at: suspendedAt,
    support_contact: 'support@example.com',
    resolution_steps: resolutionSteps,
  }
}

/**
 * Format suspension notification email content
 *
 * @param template - The suspension notification template
 * @returns Formatted email subject and body
 */
export function formatSuspensionNotificationEmail(
  template: SuspensionNotificationTemplate
): { subject: string; body: string } {
  const { project_name, org_name, reason, suspended_at, support_contact, resolution_steps } =
    template

  const subject = `[URGENT] Project "${project_name}" Suspended - ${org_name}`

  const body = `
IMPORTANT: Your project has been suspended

Project: ${project_name}
Organization: ${org_name}
Suspended At: ${suspended_at.toLocaleString()}
Reason: ${reason.details || `Exceeded ${reason.cap_type} limit`}

Violation Details:
- Limit Exceeded: ${reason.cap_type}
- Current Usage: ${reason.current_value.toLocaleString()}
- Limit: ${reason.limit_exceeded.toLocaleString()}

What Happened:
Your project has exceeded its hard cap for ${reason.cap_type}. To protect the platform
and other users, the project has been automatically suspended.

How to Resolve This Issue:
${resolution_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Need Help?
If you believe this suspension is in error or need assistance resolving this issue,
please contact our support team at ${support_contact}.

Please include your project ID and organization name in your correspondence.

---
This is an automated notification. Please do not reply directly to this email.
`.trim()

  return { subject, body }
}

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

    console.log(`[Notifications] Created notification ${result.rows[0].id}`)
    return result.rows[0].id
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error)
    throw new Error('Failed to create notification')
  }
}

/**
 * Send a notification via email channel using Resend
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email body
 * @returns Delivery result
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  body: string
): Promise<NotificationDeliveryResult> {
  try {
    console.log(`[Notifications] Sending email to ${to}`)

    // Send email using Resend service
    const result: EmailSendResult = await sendPlainTextEmail(to, subject, body)

    if (result.success) {
      console.log(`[Notifications] Email sent successfully to ${to}, ID: ${result.messageId}`)
      return {
        success: true,
        notification_id: result.messageId || 'unknown',
        channel: NotificationChannelEnum.EMAIL,
        delivered_at: new Date(),
        attempts: 1,
      }
    } else {
      console.error(`[Notifications] Failed to send email to ${to}: ${result.error}`)
      return {
        success: false,
        notification_id: 'failed',
        channel: NotificationChannelEnum.EMAIL,
        delivered_at: new Date(),
        attempts: 1,
        error: result.error,
      }
    }
  } catch (error) {
    console.error('[Notifications] Error sending email notification:', error)
    return {
      success: false,
      notification_id: 'error',
      channel: NotificationChannelEnum.EMAIL,
      delivered_at: new Date(),
      attempts: 1,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

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
    console.log(
      `[Notifications] Sent suspension notification to ${successfulDeliveries}/${recipients.length} recipients`
    )

    return deliveryResults
  } catch (error) {
    console.error('[Notifications] Error sending suspension notification:', error)
    throw new Error('Failed to send suspension notification')
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
        await updateNotificationDeliveryStatus(
          row.id,
          NotificationStatusEnum.RETRYING
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
