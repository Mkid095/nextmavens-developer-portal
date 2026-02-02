/**
 * Verify Notification Integration - Checks Module - Constants
 */

export const REQUIRED_NOTIFICATION_TYPES = [
  'NotificationType',
  'NotificationPriority',
  'NotificationStatus',
  'NotificationChannel',
  'Notification',
  'NotificationRecipient',
  'SuspensionNotificationTemplate',
  'NotificationDeliveryResult',
] as const

export const REQUIRED_NOTIFICATION_FUNCTIONS = [
  'getNotificationRecipients',
  'createSuspensionNotificationTemplate',
  'formatSuspensionNotificationEmail',
  'createNotification',
  'sendEmailNotification',
  'sendSuspensionNotification',
  'updateNotificationDeliveryStatus',
  'getNotification',
  'getProjectNotifications',
  'retryFailedNotifications',
] as const

export const REQUIRED_EMAIL_SERVICE_FUNCTIONS = [
  'sendEmail',
  'sendPlainTextEmail',
  'sendHtmlEmail',
  'isValidEmail',
  'sendBatchEmails',
] as const

export const REQUIRED_PREFERENCE_FUNCTIONS = [
  'getNotificationPreferences',
  'getNotificationPreference',
  'upsertNotificationPreference',
  'deleteNotificationPreference',
  'getDefaultNotificationPreferences',
  'applyDefaultNotificationPreferences',
  'shouldReceiveNotification',
  'getEnabledChannels',
] as const

export const REQUIRED_EMAIL_CONTENT = [
  'Test Project',
  'Test Org',
  '15000',
  '10000',
  'support',
] as const

export const DATABASE_TABLES = ['notifications', 'notification_preferences'] as const
