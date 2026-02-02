/**
 * Notification Preferences Library
 * @deprecated Re-exports from notification-preferences module for backward compatibility
 * Import from './notification-preferences' instead
 *
 * Manages user notification preferences for different notification types
 * and delivery channels. Provides a centralized API for managing preferences.
 */

export * from './notification-preferences/types'
export { getDefaultNotificationPreferences } from './notification-preferences/defaults'
export {
  queryNotificationPreferences as getNotificationPreferences,
  queryNotificationPreference as getNotificationPreference,
  upsertNotificationPreference,
  deleteNotificationPreference,
  applyDefaultNotificationPreferences,
} from './notification-preferences/queries'
export { NotificationPreferencesManager } from './notification-preferences/manager'
export { shouldReceiveNotification, getEnabledChannels } from './notification-preferences'
