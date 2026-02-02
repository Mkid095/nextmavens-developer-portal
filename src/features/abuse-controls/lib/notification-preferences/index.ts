/**
 * Notification Preferences Module
 *
 * Manages user notification preferences for different notification types
 * and delivery channels. Provides a centralized API for managing preferences.
 */

export * from './types'
export { getDefaultNotificationPreferences } from './defaults'
export {
  queryNotificationPreferences as getNotificationPreferences,
  queryNotificationPreference as getNotificationPreference,
  upsertNotificationPreference,
  deleteNotificationPreference,
  applyDefaultNotificationPreferences,
} from './queries'
export { NotificationPreferencesManager } from './manager'

// Convenience functions
import * as queries from './queries'

export async function shouldReceiveNotification(
  userId: string,
  notificationType: import('./types').NotificationType,
  projectId?: string
): Promise<boolean> {
  const preference = await queries.queryNotificationPreference(userId, notificationType, projectId)

  // If no preference exists, default to enabled
  if (!preference) {
    return true
  }

  return preference.enabled
}

export async function getEnabledChannels(
  userId: string,
  notificationType: import('./types').NotificationType,
  projectId?: string
): Promise<import('./types').NotificationChannel[]> {
  const preference = await queries.queryNotificationPreference(userId, notificationType, projectId)

  // If no preference exists, default to email
  if (!preference) {
    return ['email' as import('./types').NotificationChannel]
  }

  return preference.channels
}
