/**
 * Notification Library
 *
 * Manages notification delivery for suspension events and other abuse control alerts.
 * Provides functions to create, send, and track notifications to project owners and org members.
 *
 * This module has been refactored into smaller, focused modules:
 * - notification/recipients.ts - Getting and filtering recipients
 * - notification/templates.ts - Creating notification templates
 * - notification/email.ts - Sending email notifications
 * - notification/database.ts - Database operations
 * - notification/suspension.ts - Suspension notifications
 * - notification/webhook.ts - Webhook notifications
 * - notification/retry.ts - Retrying failed notifications
 */

// Re-export all notification functions from submodules
export {
  getNotificationRecipients,
  createSuspensionNotificationTemplate,
  formatSuspensionNotificationEmail,
  sendEmailNotification,
  createNotification,
  updateNotificationDeliveryStatus,
  getNotification,
  getProjectNotifications,
  sendSuspensionNotification,
  sendWebhookDisabledNotification,
  retryFailedNotifications,
} from './notification/index'
