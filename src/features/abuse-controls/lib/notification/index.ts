/**
 * Notification Library
 * Re-exports all notification modules
 */

// Recipients
export { getNotificationRecipients } from './recipients'

// Templates
export {
  createSuspensionNotificationTemplate,
  formatSuspensionNotificationEmail,
} from './templates'

// Email
export { sendEmailNotification } from './email'

// Database operations
export {
  createNotification,
  updateNotificationDeliveryStatus,
  getNotification,
  getProjectNotifications,
} from './database'

// Suspension notifications
export { sendSuspensionNotification } from './suspension'

// Webhook notifications
export { sendWebhookDisabledNotification } from './webhook'

// Retry
export { retryFailedNotifications } from './retry'
