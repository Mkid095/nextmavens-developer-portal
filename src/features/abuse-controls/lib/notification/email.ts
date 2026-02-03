/**
 * Email Notification Module
 * Functions for sending email notifications
 */

import type { NotificationDeliveryResult } from '../../types'
import { NotificationChannel as NotificationChannelEnum } from '../../types'
import { sendPlainTextEmail, type EmailSendResult } from '../email-service'

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
