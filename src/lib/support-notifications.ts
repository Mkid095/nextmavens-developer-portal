/**
 * Support Request Notification Service
 *
 * Handles email notifications for support requests:
 * - Email sent on support request creation
 * - Email sent when status changes
 *
 * US-009: Send Support Notifications
 */

import { sendHtmlEmail, type EmailSendResult } from '@/features/abuse-controls/lib/email-service'
import { getPool } from '@/lib/db'

/**
 * Support request notification data
 */
export interface SupportRequestNotificationData {
  /** Support request ID */
  requestId: string
  /** User's email address */
  userEmail: string
  /** User's name */
  userName: string
  /** Project name */
  projectName: string
  /** Support request subject */
  subject: string
  /** Current status */
  status: string
  /** Previous status (for status change notifications) */
  previousStatus?: string
}

/**
 * Generate HTML email for support request created
 */
function generateCreatedEmailHtml(data: SupportRequestNotificationData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  const supportUrl = `${appUrl}/dashboard/projects/${data.projectName}?tab=support`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Support Request Created - ${data.subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Support Request Created</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hello ${data.userName},</p>
        <p>Your support request has been created successfully. Our team will review it and get back to you as soon as possible.</p>

        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1f2937;">${data.subject}</h3>
          <p style="margin-bottom: 0;"><strong>Request ID:</strong> ${data.requestId}</p>
          <p style="margin-bottom: 0;"><strong>Project:</strong> ${data.projectName}</p>
          <p style="margin-bottom: 0;"><strong>Status:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${data.status}</span></p>
        </div>

        <p>You can track the status of your request and view any updates by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${supportUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">View Support Request</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${supportUrl}</p>
        <p style="color: #666; font-size: 14px;">We'll send you an email notification when your request status changes.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>NextMavens Developer Portal</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text email for support request created
 */
function generateCreatedEmailText(data: SupportRequestNotificationData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  const supportUrl = `${appUrl}/dashboard/projects/${data.projectName}?tab=support`

  return `
Support Request Created - ${data.subject}

Hello ${data.userName},

Your support request has been created successfully. Our team will review it and get back to you as soon as possible.

Request Details:
- Subject: ${data.subject}
- Request ID: ${data.requestId}
- Project: ${data.projectName}
- Status: ${data.status}

You can track the status of your request and view any updates by visiting:
${supportUrl}

We'll send you an email notification when your request status changes.
  `.trim()
}

/**
 * Generate HTML email for support request status change
 */
function generateStatusChangeEmailHtml(data: SupportRequestNotificationData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  const supportUrl = `${appUrl}/dashboard/projects/${data.projectName}?tab=support`

  const statusColors: Record<string, string> = {
    open: '#dbeafe',
    in_progress: '#fef3c7',
    resolved: '#d1fae5',
    closed: '#e5e7eb',
  }

  const statusTextColors: Record<string, string> = {
    open: '#1e40af',
    in_progress: '#92400e',
    resolved: '#065f46',
    closed: '#374151',
  }

  const bgColor = statusColors[data.status] || '#e5e7eb'
  const textColor = statusTextColors[data.status] || '#374151'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Support Request Updated - ${data.subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Support Request Updated</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hello ${data.userName},</p>
        <p>Good news! Your support request status has been updated.</p>

        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #1f2937;">${data.subject}</h3>
          <p style="margin-bottom: 0;"><strong>Request ID:</strong> ${data.requestId}</p>
          <p style="margin-bottom: 0;"><strong>Project:</strong> ${data.projectName}</p>
          <p style="margin-bottom: 0;">
            <strong>Status:</strong>
            <span style="background: ${bgColor}; color: ${textColor}; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${data.status.replace(/_/g, ' ').toUpperCase()}</span>
          </p>
          ${data.previousStatus ? `<p style="margin-bottom: 0;"><strong>Previous Status:</strong> ${data.previousStatus.replace(/_/g, ' ').toUpperCase()}</p>` : ''}
        </div>

        <p>You can view the full details and any updates by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${supportUrl}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">View Support Request</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${supportUrl}</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>NextMavens Developer Portal</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text email for support request status change
 */
function generateStatusChangeEmailText(data: SupportRequestNotificationData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  const supportUrl = `${appUrl}/dashboard/projects/${data.projectName}?tab=support`

  return `
Support Request Updated - ${data.subject}

Hello ${data.userName},

Good news! Your support request status has been updated.

Request Details:
- Subject: ${data.subject}
- Request ID: ${data.requestId}
- Project: ${data.projectName}
- Current Status: ${data.status.replace(/_/g, ' ').toUpperCase()}
${data.previousStatus ? `- Previous Status: ${data.previousStatus.replace(/_/g, ' ').toUpperCase()}` : ''}

You can view the full details and any updates by visiting:
${supportUrl}
  `.trim()
}

/**
 * Send notification when support request is created
 *
 * @param data - Support request notification data
 * @returns Email send result
 */
export async function sendSupportRequestCreatedNotification(
  data: SupportRequestNotificationData
): Promise<EmailSendResult> {
  const html = generateCreatedEmailHtml(data)
  const text = generateCreatedEmailText(data)

  return sendHtmlEmail(
    data.userEmail,
    `Support Request Created: ${data.subject}`,
    html,
    text
  )
}

/**
 * Send notification when support request status changes
 *
 * @param data - Support request notification data
 * @returns Email send result
 */
export async function sendSupportRequestStatusChangeNotification(
  data: SupportRequestNotificationData
): Promise<EmailSendResult> {
  const html = generateStatusChangeEmailHtml(data)
  const text = generateStatusChangeEmailText(data)

  const statusText = data.status.replace(/_/g, ' ').toUpperCase()
  return sendHtmlEmail(
    data.userEmail,
    `Support Request Updated: ${data.subject} - ${statusText}`,
    html,
    text
  )
}

/**
 * Send support request notification (helper for both creation and status change)
 *
 * @param requestId - Support request ID
 * @param eventType - Type of event ('created' or 'status_changed')
 * @returns Email send result
 */
export async function sendSupportRequestNotification(
  requestId: string,
  eventType: 'created' | 'status_changed'
): Promise<EmailSendResult> {
  const pool = getPool()

  // Get support request with user and project info
  const result = await pool.query(
    `SELECT sr.id, sr.subject, sr.status, sr.user_id, sr.previous_status,
            d.email as user_email, d.name as user_name,
            p.project_name
     FROM control_plane.support_requests sr
     JOIN developers d ON sr.user_id = d.id
     JOIN projects p ON sr.project_id = p.id
     WHERE sr.id = $1`,
    [requestId]
  )

  if (result.rows.length === 0) {
    console.error(`[SupportNotifications] Support request ${requestId} not found`)
    return {
      success: false,
      error: 'Support request not found',
    }
  }

  const row = result.rows[0]

  const data: SupportRequestNotificationData = {
    requestId: row.id,
    userEmail: row.user_email,
    userName: row.user_name || 'User',
    projectName: row.project_name,
    subject: row.subject,
    status: row.status,
    previousStatus: row.previous_status || undefined,
  }

  if (eventType === 'created') {
    return sendSupportRequestCreatedNotification(data)
  } else {
    return sendSupportRequestStatusChangeNotification(data)
  }
}
