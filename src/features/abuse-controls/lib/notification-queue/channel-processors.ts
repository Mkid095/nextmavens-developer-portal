/**
 * Notification Channel Processors
 *
 * Contains the specific implementation for each notification channel.
 * Each processor handles the delivery of notifications through its
 * respective channel.
 */

import type { NotificationChannel, NotificationStatus } from '../types'
import { sendEmailNotification } from '../notifications'
import type { QueuedNotification } from './queue-operations'
import { updateNotificationResult } from './queue-operations'
import { getNotificationRecipients } from './utils'

/**
 * Notification processing result
 */
export interface ProcessingResult {
  notificationId: string
  success: boolean
  channel: NotificationChannel
  error?: string
}

/**
 * Process a single email notification
 *
 * Sends the notification to all eligible recipients for the project.
 * Respects user notification preferences and handles individual recipient
 * delivery failures.
 *
 * @param notification - The notification to process
 * @returns Processing result for the email channel
 */
export async function processEmailNotification(
  notification: QueuedNotification
): Promise<ProcessingResult> {
  const channel: NotificationChannel = 'email'

  try {
    // Get notification recipients (respecting their preferences)
    const recipients = await getNotificationRecipients(
      notification.project_id,
      notification.notification_type
    )

    if (recipients.length === 0) {
      console.warn(
        `[NotificationQueue] No recipients found for notification ${notification.id}`
      )
      await updateNotificationResult(
        notification.id,
        'failed' as NotificationStatus,
        'No recipients found'
      )
      return {
        notificationId: notification.id,
        success: false,
        channel,
        error: 'No recipients found',
      }
    }

    // Send to all recipients
    let allSuccessful = true
    let lastError: string | undefined

    for (const recipient of recipients) {
      const result = await sendEmailNotification(
        recipient.email,
        notification.subject,
        notification.body
      )

      if (!result.success) {
        allSuccessful = false
        lastError = result.error
      }
    }

    // Update notification status
    if (allSuccessful) {
      await updateNotificationResult(notification.id, 'delivered' as NotificationStatus)
      return {
        notificationId: notification.id,
        success: true,
        channel,
      }
    } else {
      await updateNotificationResult(
        notification.id,
        'failed' as NotificationStatus,
        lastError
      )
      return {
        notificationId: notification.id,
        success: false,
        channel,
        error: lastError,
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(
      `[NotificationQueue] Error processing email notification ${notification.id}:`,
      errorMessage
    )

    await updateNotificationResult(
      notification.id,
      'failed' as NotificationStatus,
      errorMessage
    )
    return {
      notificationId: notification.id,
      success: false,
      channel,
      error: errorMessage,
    }
  }
}

/**
 * Process an in-app notification
 *
 * Placeholder for in-app notification delivery.
 * TODO: Implement in-app notification delivery using WebSocket or push notifications.
 *
 * @param notification - The notification to process
 * @returns Processing result for the in-app channel
 */
export async function processInAppNotification(
  notification: QueuedNotification
): Promise<ProcessingResult> {
  const channel: NotificationChannel = 'in_app'

  // TODO: Implement in-app notification delivery
  console.log(`[NotificationQueue] In-app notifications not yet implemented`)
  await updateNotificationResult(
    notification.id,
    'delivered' as NotificationStatus,
    undefined
  )
  return {
    notificationId: notification.id,
    success: true,
    channel,
  }
}

/**
 * Process an SMS notification
 *
 * Placeholder for SMS notification delivery.
 * TODO: Implement SMS notification delivery using a provider like Twilio.
 *
 * @param notification - The notification to process
 * @returns Processing result for the SMS channel
 */
export async function processSmsNotification(
  notification: QueuedNotification
): Promise<ProcessingResult> {
  const channel: NotificationChannel = 'sms'

  // TODO: Implement SMS notification delivery
  console.log(`[NotificationQueue] SMS notifications not yet implemented`)
  await updateNotificationResult(
    notification.id,
    'failed' as NotificationStatus,
    'SMS not implemented'
  )
  return {
    notificationId: notification.id,
    success: false,
    channel,
    error: 'SMS not implemented',
  }
}

/**
 * Process a webhook notification
 *
 * Placeholder for webhook notification delivery.
 * TODO: Implement webhook notification delivery with retry logic.
 *
 * @param notification - The notification to process
 * @returns Processing result for the webhook channel
 */
export async function processWebhookNotification(
  notification: QueuedNotification
): Promise<ProcessingResult> {
  const channel: NotificationChannel = 'webhook'

  // TODO: Implement webhook notification delivery
  console.log(`[NotificationQueue] Webhook notifications not yet implemented`)
  await updateNotificationResult(
    notification.id,
    'failed' as NotificationStatus,
    'Webhook not implemented'
  )
  return {
    notificationId: notification.id,
    success: false,
    channel,
    error: 'Webhook not implemented',
  }
}

/**
 * Channel processor mapping
 *
 * Maps notification channels to their processor functions.
 * This allows for easy channel resolution and processing.
 */
export const CHANNEL_PROCESSORS: Record<
  NotificationChannel,
  (notification: QueuedNotification) => Promise<ProcessingResult>
> = {
  email: processEmailNotification,
  in_app: processInAppNotification,
  sms: processSmsNotification,
  webhook: processWebhookNotification,
}

/**
 * Get processor for a channel
 *
 * Returns the appropriate processor function for a given channel.
 * Throws an error if the channel is unknown.
 *
 * @param channel - The notification channel
 * @returns The processor function for the channel
 */
export function getChannelProcessor(
  channel: NotificationChannel
): (notification: QueuedNotification) => Promise<ProcessingResult> {
  const processor = CHANNEL_PROCESSORS[channel]

  if (!processor) {
    throw new Error(`Unknown channel: ${channel}`)
  }

  return processor
}
