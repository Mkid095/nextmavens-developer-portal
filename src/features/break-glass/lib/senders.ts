/**
 * Break Glass Notification Senders
 *
 * Handles sending notifications to recipients with error handling and logging.
 *
 * US-012: Add Break Glass Notifications
 */

import { sendHtmlEmail, type EmailSendResult } from '@/features/abuse-controls/lib/email-service';
import { getNotificationRecipients } from './utils';

/**
 * Send notification to all recipients
 *
 * @param recipients - List of email addresses to notify
 * @param subject - Email subject line
 * @param htmlBody - HTML email body
 * @param plainTextBody - Plain text email body
 * @param notificationType - Type of notification (for logging)
 * @throws Error if any email fails to send
 */
async function sendToAllRecipients(
  recipients: string[],
  subject: string,
  htmlBody: string,
  plainTextBody: string,
  notificationType: string
): Promise<void> {
  const results: EmailSendResult[] = [];

  console.log(
    `[BreakGlassNotifications] Sending ${notificationType} notification to ${recipients.length} recipient(s)`
  );

  // Send emails to all recipients
  for (const recipient of recipients) {
    const result = await sendHtmlEmail(recipient, subject, htmlBody, plainTextBody);
    results.push(result);

    // Add a small delay between sends to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Check if all emails were sent successfully
  const failedCount = results.filter((r) => !r.success).length;
  if (failedCount > 0) {
    const errorMessages = results
      .filter((r) => r.error)
      .map((r) => r.error)
      .join('; ');
    console.error(
      `[BreakGlassNotifications] Failed to send ${failedCount} notification(s): ${errorMessages}`
    );
    throw new Error(`Failed to send break glass notification: ${errorMessages}`);
  }

  console.log(
    `[BreakGlassNotifications] Successfully sent ${notificationType} notification to ${results.length} recipient(s)`
  );
}

/**
 * Send session created notification
 *
 * @param subject - Email subject line
 * @param htmlBody - HTML email body
 * @param plainTextBody - Plain text email body
 * @throws Error if any email fails to send
 */
export async function sendSessionCreatedNotification(
  subject: string,
  htmlBody: string,
  plainTextBody: string
): Promise<void> {
  const recipients = getNotificationRecipients();
  await sendToAllRecipients(recipients, subject, htmlBody, plainTextBody, 'session created');
}

/**
 * Send action performed notification
 *
 * @param subject - Email subject line
 * @param htmlBody - HTML email body
 * @param plainTextBody - Plain text email body
 * @throws Error if any email fails to send
 */
export async function sendActionPerformedNotification(
  subject: string,
  htmlBody: string,
  plainTextBody: string
): Promise<void> {
  const recipients = getNotificationRecipients();
  await sendToAllRecipients(recipients, subject, htmlBody, plainTextBody, 'action performed');
}
